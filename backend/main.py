from fastapi import FastAPI, Response, Request, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import HTMLResponse
from email.message import EmailMessage
from models.database_models import User, LoginUser
import bcrypt
from bson import ObjectId, errors
import base64
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import smtplib
import uvicorn
import motor.motor_asyncio
import jwt
import os
import re
from dotenv import load_dotenv


load_dotenv()

@asynccontextmanager
async def lifespan(application: FastAPI):
    await check_ttl_index()  # Ensure index exists before app starts
    yield  # Application starts here
    # Any cleanup code can go here if needed

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace * with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def check_ttl_index():
    indexes_cursor = registrations.list_indexes()  # This returns a cursor

    async for index in indexes_cursor:  # Iterate over the cursor asynchronously
        if "expiresAt" in index["key"]:
            return
    await registrations.create_index("expiresAt", expireAfterSeconds=0)


#mongodb config
db_admin = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
mongoURI = f'mongodb+srv://{db_admin}:{db_password}@cluster0.c6szrff.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
client = motor.motor_asyncio.AsyncIOMotorClient(mongoURI)
database = client[os.getenv('DB_NAME')]
users = database['users']
registrations = database['registrations']

emailRegex = r"^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@srmap\.edu\.in$"
passwordRegex = r"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W\_])[A-Za-z\d\W\_]+$"


@app.get('/')
async def index():
    return {"helloo!!"}


@app.post('/register')
async def register(response: Response, user: User):
    user = user.model_dump()
    if user['name'].strip() == '' or user['mail'].strip() == '' or user['password'].strip() == '':
        response.status_code = status.HTTP_406_NOT_ACCEPTABLE
        return {"message": "Empty Fields!"}

    if not re.match(emailRegex, user['mail']):
        response.status_code = status.HTTP_406_NOT_ACCEPTABLE
        return {"message": "Email mismatch!"}

    if not re.match(passwordRegex, user['password']):
        response.status_code = status.HTTP_406_NOT_ACCEPTABLE
        return {"message": "Password is not secure!"}

    existing_user = await users.find_one({"mail": user['mail']})

    if existing_user is not None:
        response.status_code = status.HTTP_409_CONFLICT
        return {"message": "Email already Exists!"}
    try:
        password = user['password'].encode('utf-8')
        hashed_password = bcrypt.hashpw(password, bcrypt.gensalt(rounds=int(os.getenv('SALT_ROUNDS'))))

        user['password'] = base64.b64encode(hashed_password).decode('utf-8')

        expiry_time = datetime.now(timezone.utc) + timedelta(hours=24)

        user['expiresAt'] = expiry_time
        new_item = await registrations.insert_one(user)
        data = {'_id': str(new_item.inserted_id)}
        auth_key = jwt.encode(data, os.getenv('JWT_KEY'), algorithm="HS256")
        smtp_server = smtplib.SMTP('smtp.gmail.com', 587)
        smtp_server.starttls()
        smtp_server.login(os.getenv('EMAIL'), os.getenv('EMAIL_PASSWORD'))
        composed_email = EmailMessage()
        composed_email['Subject'] = 'Complete your registration at StegaVault'
        composed_email['From'] = os.getenv('EMAIL')
        composed_email['To'] = user['mail']
        composed_email.add_alternative(f"""
        <!DOCTYPE html>
        <html>
            <body>
                <h2>Welcome to one of the most sophisticated and secure Digital Asset management systems!</h2>
                <p>To complete your registration</p>
                <p>please <a href="{os.getenv('EMAIL_REGISTRATION_LINK')}/complete-registration/{auth_key}">Click Here</a> to register for <b>StegaVault</b></p>
            </body>
        </html>
        """, subtype="html")
        smtp_server.send_message(composed_email)
        return {"message": "Registration email sent to the given email id!"}
    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"message": "Internal server error, please try again later!"}

@app.get('/complete-registration/{auth_token}', response_class=HTMLResponse)
async def complete_registration(auth_token: str):
    new_item = None
    try:
        data = jwt.decode(auth_token, os.getenv('JWT_KEY'), algorithms=["HS256"])
        user = await registrations.find_one({'_id': ObjectId(data['_id'])})
        user = dict(user)
        user.pop('_id')
        user.pop('expiresAt')
        new_item = await users.insert_one(user)
        await registrations.find_one_and_delete({'_id': ObjectId(data['_id'])})
        return f"""
        <!DOCTYPE html>
        <html>
            <head>
                <title>Registration complete!</title>
            </head>
            <body>
                <h1>Welcome to StegaVault</h1>
                <p>your registration was complete with {auth_token}</p>
                <p>Please close this tab and login using your credentials!</p>
            </body>
        </html>
        """
    except errors.InvalidId:
        if new_item is not None:
            await users.find_one_and_delete({'_id': new_item.inserted_id})
    except Exception as e:
        return f"""
        <!DOCTYPE html>
        <html>
            <head>
                <title>Registration failed!</title>
            </head>
            <body>
                <h1>Welcome to StegaVault</h1>
                <p style="color: red;">your registration was not successful :(</p>
            </body>
        </html>
        """


@app.post('/login')
async def login(request: Request, user:LoginUser, response: Response):
    user = user.model_dump()
    if user['mail'].strip() == '' or user['password'].strip() == '':
        response.status_code = status.HTTP_406_NOT_ACCEPTABLE
        return {"message": "Empty fields!"}

    existing_user = await users.find_one({'mail': user['mail']})
    if existing_user is None:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message": "User does not Exist!"}

    existing_user = dict(existing_user)
    try:
        entered_password_bytes = user['password'].encode('utf-8')

        # Decode the stored password from Base64
        stored_hashed_bytes = base64.b64decode(existing_user['password'])

        if not bcrypt.checkpw(entered_password_bytes, stored_hashed_bytes):
            response.status_code = status.HTTP_401_UNAUTHORIZED
            return {"message": "Invalid password!"}
        data = {'_id': str(existing_user['_id']), 'validTill': datetime.now(timezone.utc).timestamp()+86400}
        auth_token = jwt.encode(data, os.getenv('JWT_KEY'), algorithm="HS256")
        return {"message": "User login successful", "auth_token": auth_token}
    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"message": "Inernal server error, please try again later!"}
    

@app.post('/checkUser')
async def checkUser(request: Request, response: Response):
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {"valid": False, "message": "Unauthorized Access!"}

    auth_token = req_headers['auth_token']
    try:
        await checkUserHelper(auth_token)
        return {"valid": True}
    except Exception as e:
        error = e.args[0]
        response.status_code = status.HTTP_401_UNAUTHORIZED if error["message"] != "Internal Server Error!" else status.HTTP_500_INTERNAL_SERVER_ERROR
        return error


async def checkUserHelper(auth_token: str):
    try:
        data = jwt.decode(auth_token, os.getenv('JWT_KEY'), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise Exception({"valid": False, "message": "Token expired!"})
    except jwt.InvalidTokenError:
        raise Exception({"valid": False, "message": "Unauthorized access!"})

    try:
        user = await users.find_one({'_id': ObjectId(data['_id'])})
        if not user:
            raise Exception({"valid": False, "message": "Unauthorized access!"})
    except Exception:
        raise Exception({"valid": False, "message": "Internal Server Error!"})

    if data['validTill'] <= datetime.now(timezone.utc).timestamp() + 600:
        raise Exception({"valid": False, "message": "Session expired please login again!"})

    return user  # or return data if you just need token info


if __name__ == '__main__':
    uvicorn.run("main:app", reload=True)