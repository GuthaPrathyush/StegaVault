from fastapi import FastAPI, Response, Request, status, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import HTMLResponse
from email.message import EmailMessage
from models.database_models import User, LoginUser, OwnershipVerificationRequest
import bcrypt
from bson import ObjectId, errors
import base64
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import cloudinary
import cloudinary.uploader
import smtplib
import uvicorn
import motor.motor_asyncio
import jwt
import os
import re
from stegano import lsb
import io
from PIL import Image
import httpx
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
nfts = database['nfts']
transactions = database['transactions']

#cloudinary config
cloudinary.config(
    cloud_name = "ddvewtyvu",
    api_key = "253238265924481",
    api_secret = os.getenv('CLOUDINARY_API_SECRET_KEY'), # Click 'View API Keys' above to copy your API secret
    secure=True
)

emailRegex = r"^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
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


@app.post('/upload-nft')
async def upload_nft(
    response: Response,
    request: Request,
    image: UploadFile = File(...),
    name: str = Form(...),
    price: float = Form(...)
):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    # Variables to track created objects for cleanup in case of failure
    nft_id = None
    transaction_id = None
    
    try:
        # Authenticate user
        user = await checkUserHelper(auth_token)
        publisher_mail = user['mail']
        user_id = str(user['_id'])
        
        # Create NFT entry in database
        nft_data = {
            "name": name,
            "price": price,
            "publisher_mail": publisher_mail,
            "owner_mail": publisher_mail,  # Initially, publisher is the owner
            "timestamp": datetime.now(timezone.utc),
            "status": "active"
        }
        
        # Insert NFT data and get the NFT ID
        nft_result = await nfts.insert_one(nft_data)
        nft_id = str(nft_result.inserted_id)
        
        # Create initial transaction record (minting)
        transaction_data = {
            "nft_id": nft_id,
            "from": publisher_mail,
            "to": publisher_mail,  # Same user as it's a mint
            "type": "mint",
            "price": 0,
            "timestamp": datetime.now(timezone.utc)
        }
        
        # Insert transaction data and get transaction ID
        transaction_result = await transactions.insert_one(transaction_data)
        transaction_id = str(transaction_result.inserted_id)
        
        # Create a consistent private key that won't change with time
        # Using only the user ID without validTill attribute
        consistent_private_key = jwt.encode(
            {'_id': user_id}, 
            os.getenv('JWT_KEY'), 
            algorithm="HS256"
        )
        
        # Create data to be encoded in the image
        steganography_data = {
            "data": {
                "owner_mail": publisher_mail,
                "nft_id": nft_id,
                "transaction_id": transaction_id
            },
            "private_key": consistent_private_key
        }
        
        # Use JWT to encode the steganography data instead of just JSON
        encoded_data = jwt.encode(
            steganography_data, 
            os.getenv('JWT_KEY'), 
            algorithm="HS256"
        )
        
        # Read image content
        image_content = await image.read()
        img = Image.open(io.BytesIO(image_content))
        
        # Print image details for debugging
        print(f"Original image format: {img.format}, size: {img.size}, mode: {img.mode}")
        
        # Convert to RGB mode if it's not already (needed for some formats)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Always convert to PNG (lossless format) before steganography
        png_buffer = io.BytesIO()
        img.save(png_buffer, format='PNG')
        png_buffer.seek(0)
        img = Image.open(png_buffer)
        
        try:
            # Attempt to encode the JWT token in the image
            stego_img = lsb.hide(img, encoded_data)
            
            # Save the steganographed image to a buffer - ALWAYS use PNG format
            buffer = io.BytesIO()
            stego_img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Upload to Cloudinary with specific options to prevent compression
            upload_result = cloudinary.uploader.upload(
                buffer, 
                folder="nft_images",
                public_id=f"nft_{nft_id}",
                resource_type="image",
                format="png",  # Force PNG format
                quality="100"  # Use highest quality
            )
            
            # Get the Cloudinary URL
            image_url = upload_result.get('secure_url')
            
            # Update the NFT record with the image URL
            await nfts.update_one(
                {"_id": ObjectId(nft_id)},
                {"$set": {"image_url": image_url}}
            )
            
            return {
                "success": True,
                "message": "NFT created successfully",
                "nft_id": nft_id,
                "image_url": image_url
            }
            
        except Exception as e:
            # Print detailed error for debugging
            print(f"Steganography error: {str(e)}")
            
            # Clean up created objects
            if nft_id:
                await nfts.delete_one({"_id": ObjectId(nft_id)})
            if transaction_id:
                await transactions.delete_one({"_id": ObjectId(transaction_id)})
                
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {
                "success": False,
                "message": f"Image processing error: {str(e)}. Try using a larger PNG image."
            }
            
    except Exception as e:
        # Print detailed error for debugging
        print(f"General error in upload-nft: {str(e)}")
        
        # Clean up any created objects if there's an error
        if nft_id:
            await nfts.delete_one({"_id": ObjectId(nft_id)})
        if transaction_id:
            await transactions.delete_one({"_id": ObjectId(transaction_id)})
            
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error creating NFT: {str(e)}"}


@app.post('/verifyOwnership')
async def verify_ownership(
    verification_data: OwnershipVerificationRequest,
    response: Response, 
    request: Request
):
    # Authentication checks remain the same
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Authenticate user
        await checkUserHelper(auth_token)
        
        # Extract data from the Pydantic model
        nft_id = verification_data.nft_id
        claimed_owner_mail = verification_data.owner_mail
        
        # Fetch NFT document from database
        nft = await nfts.find_one({'_id': ObjectId(nft_id)})
        if not nft:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"success": False, "message": "NFT not found"}
        
        # Get the owner_mail from the database record
        db_owner_mail = nft.get('owner_mail')
        
        # First verification: Check if claimed owner matches database record
        if claimed_owner_mail != db_owner_mail:
            response.status_code = status.HTTP_403_FORBIDDEN
            return {
                "success": False, 
                "message": "Ownership verification failed: Claimed owner does not match database record"
            }
        
        # Second verification: Extract embedded data from the NFT image
        try:
            # Use the extractNftDataHelper to get the embedded data from the image
            decoded_jwt = await extractNftDataHelper(nft_id)
            
            # The decoded JWT contains a nested 'data' object with the owner_mail
            # Check if decoded_jwt and data field exist
            if not decoded_jwt or 'data' not in decoded_jwt:
                response.status_code = status.HTTP_400_BAD_REQUEST
                return {
                    "success": False,
                    "message": "Ownership verification failed: Invalid embedded data structure"
                }
            
            # Access the nested owner_mail field
            embedded_owner_mail = decoded_jwt['data'].get('owner_mail')
            
            if not embedded_owner_mail:
                response.status_code = status.HTTP_400_BAD_REQUEST
                return {
                    "success": False,
                    "message": "Ownership verification failed: No owner information in embedded data"
                }
            
            # Verify that the embedded owner matches the claimed owner
            if embedded_owner_mail != claimed_owner_mail:
                response.status_code = status.HTTP_403_FORBIDDEN
                return {
                    "success": False, 
                    "message": "Ownership verification failed: Embedded data does not match claimed owner"
                }
            
            # Also verify that the embedded nft_id matches the claimed nft_id
            embedded_nft_id = decoded_jwt['data'].get('nft_id')
            if embedded_nft_id != nft_id:
                response.status_code = status.HTTP_403_FORBIDDEN
                return {
                    "success": False, 
                    "message": "Ownership verification failed: Embedded NFT ID does not match claimed NFT ID"
                }
            
            # If we reach here, both verifications passed
            return {
                "success": True,
                "message": "Ownership verified successfully",
                "nft_id": str(nft['_id']),
                "owner_mail": claimed_owner_mail,
                "transaction_id": decoded_jwt['data'].get('transaction_id')
            }
            
        except Exception as e:
            print(f"Error extracting or verifying embedded data: {str(e)}")
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {
                "success": False, 
                "message": f"Failed to verify embedded ownership data: {str(e)}"
            }
            
    except Exception as e:
        print(f"Error in verifyOwnership: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error verifying ownership: {str(e)}"}




async def extractNftDataHelper(nft_id: str):
    try:
        # Fetch NFT document from database
        nft = await nfts.find_one({'_id': ObjectId(nft_id)})
        if not nft or 'image_url' not in nft:
            raise Exception("NFT or image not found")
        
        # Download image from Cloudinary URL
        import httpx
        async with httpx.AsyncClient() as client:
            img_response = await client.get(nft['image_url'])
            if img_response.status_code != 200:
                raise Exception("Image could not be retrieved")
            img_bytes = img_response.content
        
        # Open image
        img = Image.open(io.BytesIO(img_bytes))
        
        # Print image details for debugging
        print(f"Image format: {img.format}, size: {img.size}, mode: {img.mode}")
        
        # Convert to RGB mode if it's not already (needed for some formats)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Always convert to PNG (lossless format) before extraction
        if img.format != 'PNG':
            print("Converting image to PNG format for reliable data extraction")
            png_buffer = io.BytesIO()
            img.save(png_buffer, format='PNG')
            png_buffer.seek(0)
            img = Image.open(png_buffer)
        
        # Extract hidden data using stegano lsb
        # Extract the hidden data
        hidden_data = lsb.reveal(img)
        
        # Check if hidden_data is not None or empty
        if not hidden_data:
            print("No hidden data found in the image")
            raise Exception("No hidden data found in image")
        
        # Print the raw hidden data for debugging
        print("Hidden data before JWT decoding:", hidden_data)
        
        # Try to decode the JWT
        # Use the same JWT_KEY and algorithm as used in encoding
        decoded_data = jwt.decode(hidden_data, os.getenv('JWT_KEY'), algorithms=["HS256"])
        
        # Print the decoded data
        print("Decoded JWT data:", decoded_data)
        
        return decoded_data
            
    except jwt.ExpiredSignatureError:
        print("JWT token has expired")
        raise Exception("JWT token has expired")
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT token: {str(e)}")
        raise Exception(f"Invalid JWT token: {str(e)}")
    except Exception as e:
        print(f"Error in extractNftDataHelper: {str(e)}")
        raise Exception(str(e))


@app.post('/getUserTransactions')
async def getUserTransactions(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Authenticate user and get user information
        user = await checkUserHelper(auth_token)
        user_mail = user['mail']
        
        # Query transactions where user is either sender or receiver
        # and transaction type is not "mint"
        user_transactions = await transactions.find({
            "$and": [
                {"$or": [
                    {"from": user_mail},
                    {"to": user_mail}
                ]},
                {"type": {"$ne": "mint"}}
            ]
        }).sort("timestamp", -1).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for transaction in user_transactions:
            transaction["_id"] = str(transaction["_id"])
            
            # Format timestamp if it exists
            if "timestamp" in transaction and isinstance(transaction["timestamp"], datetime):
                transaction["timestamp"] = transaction["timestamp"].isoformat()
        
        # Return the transactions
        return {
            "success": True,
            "message": "User transactions retrieved successfully",
            "transactions": user_transactions
        }
            
    except Exception as e:
        print(f"Error retrieving user transactions: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error retrieving transactions: {str(e)}"}


@app.post('/getUserArtworks')
async def getUserArtworks(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Authenticate user and get user information
        user = await checkUserHelper(auth_token)
        user_mail = user['mail']
        
        # Query NFTs where the user is the owner
        user_artworks = await nfts.find({"owner_mail": user_mail}).sort("timestamp", -1).to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        for artwork in user_artworks:
            artwork["_id"] = str(artwork["_id"])
            
            # Format timestamp if it exists
            if "timestamp" in artwork and isinstance(artwork["timestamp"], datetime):
                artwork["timestamp"] = artwork["timestamp"].isoformat()
        
        # Return the artworks
        return {
            "success": True,
            "message": "User artworks retrieved successfully",
            "artworks": user_artworks
        }
            
    except Exception as e:
        print(f"Error retrieving user artworks: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error retrieving artworks: {str(e)}"}




if __name__ == '__main__':
    uvicorn.run("main:app", reload=True)