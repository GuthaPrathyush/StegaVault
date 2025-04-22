from fastapi import FastAPI, Response, Request, status, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import HTMLResponse
from email.message import EmailMessage
from models.database_models import User, LoginUser, OwnershipVerificationRequest
from fastapi.responses import JSONResponse
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
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def check_ttl_index():
    indexes_cursor = registrations.list_indexes() 

    async for index in indexes_cursor:  
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
    api_secret = os.getenv('CLOUDINARY_API_SECRET_KEY'), 
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
        user['balance'] = 1000.00
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
    request: Request,
    response: Response,
    name: str = Form(...),
    price: float = Form(...),
    image: UploadFile = File(...)
):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Authenticate user
        user = await checkUserHelper(auth_token)
        user_mail = user['mail']
        
        # Validate price
        if price <= 0:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "Price must be greater than zero"}
        
        # Read the uploaded image
        contents = await image.read()
        
        # Check if the image already has steganographic data
        try:
            img = Image.open(io.BytesIO(contents))
            
            # Convert to RGB mode if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Try to extract hidden data
            hidden_data = None
            try:
                hidden_data = lsb.reveal(img)
            except Exception as steg_error:
                # If lsb.reveal fails with an exception, log it but continue
                # This might mean there's no hidden data or the format is incompatible
                print(f"Steganography extraction error (likely no hidden data): {str(steg_error)}")
            
            # If we got hidden data, check if it's valid JWT
            if hidden_data:
                try:
                    # Try to decode as JWT
                    decoded_data = jwt.decode(hidden_data, os.getenv('JWT_KEY'), algorithms=["HS256"])
                    
                    # If we successfully decoded JWT, check if it has ownership data
                    if 'data' in decoded_data and 'owner_mail' in decoded_data['data']:
                        response.status_code = status.HTTP_400_BAD_REQUEST
                        return {
                            "success": False, 
                            "message": "This image already contains ownership information. Please upload original artwork only."
                        }
                except jwt.InvalidTokenError:
                    # If JWT decode fails, it might be random data that looks like steganography
                    # We'll still log it but allow the upload to proceed
                    print("Found hidden data but not a valid JWT token")
                except Exception as jwt_error:
                    # Any other JWT-related error
                    print(f"JWT processing error: {str(jwt_error)}")
                    
        except Exception as img_error:
            # If we can't open the image, reject the upload
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": f"Invalid image format: {str(img_error)}"}
        
        # If we get here, the image either doesn't have steganographic data or it's not ownership data
        # Reset file pointer to beginning for re-reading
        image_bytes = io.BytesIO(contents)
        img = Image.open(image_bytes)
        
        # Convert to RGB mode if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Create a new transaction for minting
        transaction_data = {
            "type": "mint",
            "from": user_mail,
            "to": user_mail,
            "price": 0,  # Minting is free
            "timestamp": datetime.now(timezone.utc)
        }
        
        # Insert transaction and get the ID
        transaction_result = await transactions.insert_one(transaction_data)
        transaction_id = str(transaction_result.inserted_id)
        
        # Create NFT document
        nft_data = {
            "name": name,
            "price": price,
            "publisher_mail": user_mail,
            "owner_mail": user_mail,
            "timestamp": datetime.now(timezone.utc),
            "status": "active"
        }
        
        # Insert NFT and get the ID
        nft_result = await nfts.insert_one(nft_data)
        nft_id = str(nft_result.inserted_id)
        
        # Update transaction with NFT ID
        await transactions.update_one(
            {"_id": transaction_result.inserted_id},
            {"$set": {"nft_id": nft_id}}
        )
        
        # Prepare data to embed in the image
        steganography_data = {
            "data": {
                "owner_mail": user_mail,
                "nft_id": nft_id,
                "transaction_id": transaction_id
            }
        }
        
        # Encode data as JWT
        encoded_data = jwt.encode(
            steganography_data, 
            os.getenv('JWT_KEY'), 
            algorithm="HS256"
        )
        
        # Embed data in the image using LSB steganography
        stego_img = lsb.hide(img, encoded_data)
        
        # Save the steganographed image to a buffer
        buffer = io.BytesIO()
        stego_img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            buffer, 
            folder="nft_images",
            public_id=f"nft_{nft_id}",
            resource_type="image"
        )
        
        # Get the Cloudinary URL
        image_url = upload_result.get('secure_url')
        
        # Update NFT with image URL
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
        print(f"Error creating NFT: {str(e)}")
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
            # Using the extractNftDataHelper to get the embedded data from the image
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


@app.post('/getMarketplaceItems')
async def getMarketplaceItems(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Get request body for pagination parameters
        data = await request.json()
        page = data.get('page', 1)
        items_per_page = data.get('items_per_page', 30)
        
        # Ensure page and items_per_page are valid integers
        try:
            page = int(page)
            items_per_page = int(items_per_page)
            if page < 1:
                page = 1
            if items_per_page < 1 or items_per_page > 100:  # Set reasonable limits
                items_per_page = 30
        except ValueError:
            page = 1
            items_per_page = 30
        
        # Authenticate user and get user information
        user = await checkUserHelper(auth_token)
        user_mail = user['mail']
        
        # Calculate skip value for pagination
        skip = (page - 1) * items_per_page
        
        # Query NFTs that are:
        # 1. Active
        # 2. Not owned by the current user
        # 3. Paginated based on page and items_per_page
        pipeline = [
            {
                "$match": {
                    "status": "active",
                    "owner_mail": {"$ne": user_mail}
                }
            },
            {
                "$sort": {"timestamp": -1}  # Sort by newest first
            },
            {
                "$skip": skip
            },
            {
                "$limit": items_per_page
            }
        ]
        
        # Execute the aggregation pipeline
        marketplace_items = await nfts.aggregate(pipeline).to_list(length=None)
        
        # Get total count for pagination info
        total_count = await nfts.count_documents({
            "status": "active",
            "owner_mail": {"$ne": user_mail}
        })
        
        # Calculate total pages
        total_pages = (total_count + items_per_page - 1) // items_per_page
        
        # Convert ObjectId to string for JSON serialization
        for item in marketplace_items:
            item["_id"] = str(item["_id"])
            
            # Format timestamp if it exists
            if "timestamp" in item and isinstance(item["timestamp"], datetime):
                item["timestamp"] = item["timestamp"].isoformat()
        
        # Return the marketplace items with pagination info
        return {
            "success": True,
            "message": "Marketplace items retrieved successfully",
            "items": marketplace_items,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_count,
                "items_per_page": items_per_page
            }
        }
            
    except Exception as e:
        print(f"Error retrieving marketplace items: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error retrieving marketplace items: {str(e)}"}

@app.get('/getProfile')
async def get_profile(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Authenticate user using the existing helper function
        user = await checkUserHelper(auth_token)
        
        # Extract only the required fields (name and mail)
        user_profile = {
            "name": user['name'],
            "mail": user['mail'],
            "balance": user['balance']
        }
        
        return {
            "success": True,
            "message": "User profile retrieved successfully",
            "user": user_profile
        }
            
    except Exception as e:
        print(f"Error retrieving user profile: {str(e)}")
        
        # Check if the exception has a specific error message structure
        if isinstance(e.args[0], dict) and "message" in e.args[0]:
            error_message = e.args[0]["message"]
            error_valid = e.args[0].get("valid", False)
            
            response.status_code = status.HTTP_401_UNAUTHORIZED if not error_valid else status.HTTP_500_INTERNAL_SERVER_ERROR
            return {"success": False, "message": error_message}
        
        # Generic error handling
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error retrieving user profile: {str(e)}"}



@app.post('/getNftDetails')
async def get_nft_details(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Get request body
        data = await request.json()
        nft_id = data.get('nft_id')
        
        if not nft_id:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "NFT ID is required"}
        
        # Authenticate user
        user = await checkUserHelper(auth_token)
        
        # Fetch NFT details
        nft = await nfts.find_one({'_id': ObjectId(nft_id)})
        if not nft:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"success": False, "message": "NFT not found"}
        
        # Convert ObjectId to string
        nft['_id'] = str(nft['_id'])
        
        # Format timestamp if it exists
        if "timestamp" in nft and isinstance(nft["timestamp"], datetime):
            nft["timestamp"] = nft["timestamp"].isoformat()
        
        # Fetch publisher details (only name and mail)
        publisher = await users.find_one({'mail': nft['publisher_mail']}, {'name': 1, 'mail': 1, '_id': 0})
        
        # Fetch current owner details (only name and mail)
        owner = await users.find_one({'mail': nft['owner_mail']}, {'name': 1, 'mail': 1, '_id': 0})
        
        # Fetch all transactions for this NFT (excluding mint transactions)
        nft_transactions = await transactions.find({
            'nft_id': nft_id,
            'type': {'$ne': 'mint'}
        }).sort('timestamp', -1).to_list(length=None)
        
        # Process transactions
        for transaction in nft_transactions:
            transaction['_id'] = str(transaction['_id'])
            if "timestamp" in transaction and isinstance(transaction["timestamp"], datetime):
                transaction["timestamp"] = transaction["timestamp"].isoformat()
        
        # Return combined data
        return {
            "success": True,
            "nft": nft,
            "publisher": publisher,
            "owner": owner,
            "transactions": nft_transactions
        }
            
    except Exception as e:
        print(f"Error retrieving NFT details: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error retrieving NFT details: {str(e)}"}


@app.post('/buy-nft')
async def buy_nft(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    # Variables to track created objects for cleanup in case of failure
    transaction_id = None
    
    try:
        # Get request body
        data = await request.json()
        nft_id = data.get('nft_id')
        
        if not nft_id:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "NFT ID is required"}
        
        # Authenticate buyer and get user information
        buyer = await checkUserHelper(auth_token)
        buyer_mail = buyer['mail']
        buyer_id = str(buyer['_id'])
        
        # Fetch NFT details
        nft = await nfts.find_one({'_id': ObjectId(nft_id)})
        if not nft:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"success": False, "message": "NFT not found"}
        
        # Check if NFT is active
        if nft.get('status') != 'active':
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "This NFT is not available for purchase"}
        
        # Check if buyer is not already the owner
        seller_mail = nft.get('owner_mail')
        if seller_mail == buyer_mail:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "You already own this NFT"}
        
        # Get NFT price from database (not trusting frontend)
        price = nft.get('price', 0)
        
        # Check if buyer has sufficient balance
        buyer_balance = buyer.get('balance', 0)
        if buyer_balance < price:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "Insufficient balance to purchase this NFT"}
        
        # Get seller details
        seller = await users.find_one({'mail': seller_mail})
        if not seller:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"success": False, "message": "Seller not found"}
        
        seller_id = str(seller['_id'])
        
        # Create transaction record
        transaction_data = {
            "nft_id": nft_id,
            "from": seller_mail,
            "to": buyer_mail,
            "type": "purchase",
            "price": price,
            "timestamp": datetime.now(timezone.utc)
        }
        
        # Insert transaction data and get transaction ID
        transaction_result = await transactions.insert_one(transaction_data)
        transaction_id = str(transaction_result.inserted_id)
        
        # Update NFT ownership
        await nfts.update_one(
            {"_id": ObjectId(nft_id)},
            {"$set": {"owner_mail": buyer_mail}}
        )
        
        # Update buyer's balance (deduct price)
        await users.update_one(
            {"_id": ObjectId(buyer_id)},
            {"$inc": {"balance": -price}}
        )
        
        # Update seller's balance (add price)
        await users.update_one(
            {"_id": ObjectId(seller_id)},
            {"$inc": {"balance": price}}
        )
        
        # Create data to be encoded in the image
        try:
            # Create new steganography data with updated owner
            steganography_data = {
                "data": {
                    "owner_mail": buyer_mail,
                    "nft_id": nft_id,
                    "transaction_id": transaction_id
                }
            }
            
            # Use JWT to encode the steganography data
            encoded_data = jwt.encode(
                steganography_data, 
                os.getenv('JWT_KEY'), 
                algorithm="HS256"
            )
            
            # Download the image
            async with httpx.AsyncClient() as client:
                img_response = await client.get(nft['image_url'])
                if img_response.status_code != 200:
                    raise Exception("Image could not be retrieved")
                img_bytes = img_response.content
            
            # Open image
            img = Image.open(io.BytesIO(img_bytes))
            
            # Convert to RGB mode if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Encode the new ownership data
            stego_img = lsb.hide(img, encoded_data)
            
            # Save the steganographed image to a buffer
            buffer = io.BytesIO()
            stego_img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Upload to Cloudinary with specific options
            upload_result = cloudinary.uploader.upload(
                buffer, 
                folder="nft_images",
                public_id=f"nft_{nft_id}",
                resource_type="image",
                format="png",
                quality="100",
                overwrite=True
            )
            
            # Get the new Cloudinary URL
            new_image_url = upload_result.get('secure_url')
            
            # Update the NFT record with the new image URL
            await nfts.update_one(
                {"_id": ObjectId(nft_id)},
                {"$set": {"image_url": new_image_url, "status": "inactive"}}
            )
            
        except Exception as e:
            print(f"Warning: Failed to update steganography data: {str(e)}")
            # Continue with the purchase even if steganography update fails
            # This is a non-critical error that shouldn't block the transaction
        
        return {
            "success": True,
            "message": "NFT purchased successfully",
            "transaction_id": transaction_id,
            "nft_id": nft_id,
            "price": price,
            "new_balance": buyer_balance - price
        }
            
    except Exception as e:
        # Print detailed error for debugging
        print(f"Error in buy-nft: {str(e)}")
        
        # Clean up any created transaction if there's an error
        if transaction_id:
            try:
                await transactions.delete_one({"_id": ObjectId(transaction_id)})
            except Exception as cleanup_error:
                print(f"Error during cleanup: {str(cleanup_error)}")
            
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error purchasing NFT: {str(e)}"}


@app.post('/update-nft')
async def update_nft(request: Request, response: Response):
    # Check authentication
    req_headers = dict(request.headers)
    if 'auth_token' not in req_headers:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "message": "Unauthorized Access!"}
    
    auth_token = req_headers['auth_token']
    
    try:
        # Get request body
        data = await request.json()
        nft_id = data.get('nft_id')
        new_price = data.get('price')
        new_status = data.get('status')
        
        if not nft_id:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "NFT ID is required"}
        
        # Validate price if provided
        if new_price is not None:
            try:
                new_price = float(new_price)
                if new_price <= 0:
                    response.status_code = status.HTTP_400_BAD_REQUEST
                    return {"success": False, "message": "Price must be greater than zero"}
            except ValueError:
                response.status_code = status.HTTP_400_BAD_REQUEST
                return {"success": False, "message": "Invalid price format"}
        
        # Validate status if provided
        if new_status is not None and new_status not in ['active', 'inactive']:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "Status must be 'active' or 'inactive'"}
        
        # Authenticate user
        user = await checkUserHelper(auth_token)
        user_mail = user['mail']
        
        # Fetch NFT details
        nft = await nfts.find_one({'_id': ObjectId(nft_id)})
        if not nft:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"success": False, "message": "NFT not found"}
        
        # Check if user is the owner
        if nft.get('owner_mail') != user_mail:
            response.status_code = status.HTTP_403_FORBIDDEN
            return {"success": False, "message": "You must be the owner to update this NFT"}
        
        # Prepare update data
        update_data = {}
        if new_price is not None:
            update_data['price'] = new_price
        if new_status is not None:
            update_data['status'] = new_status
        
        if not update_data:
            response.status_code = status.HTTP_400_BAD_REQUEST
            return {"success": False, "message": "No update data provided"}
        
        # Update NFT
        await nfts.update_one(
            {"_id": ObjectId(nft_id)},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "NFT updated successfully",
            "nft_id": nft_id,
            "updates": update_data
        }
            
    except Exception as e:
        print(f"Error updating NFT: {str(e)}")
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {"success": False, "message": f"Error updating NFT: {str(e)}"}


@app.post("/verify-nft-ownership")
async def verify_nft_ownership(file: UploadFile = File(...)):
    """
    Verify the ownership of an NFT by extracting steganographic data from an image.
    
    Args:
        file: The uploaded image file
    
    Returns:
        JSON response with ownership information if found
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Open the image using PIL
        img = Image.open(io.BytesIO(contents))
        
        # Convert to RGB mode if needed (for PNG with transparency)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        try:
            # Extract the hidden data using LSB steganography
            hidden_data = lsb.reveal(img)
            
            if not hidden_data:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"success": False, "message": "No steganographic data found in this image"}
                )
            
            # Decode the JWT token
            try:
                decoded_data = jwt.decode(hidden_data, os.getenv('JWT_KEY'), algorithms=["HS256"])
                
                # Check if the decoded data contains ownership information
                if 'data' in decoded_data and 'owner_mail' in decoded_data['data']:
                    return JSONResponse(
                        content={
                            "success": True,
                            "message": "Ownership information found",
                            "ownership_data": {
                                "owner_mail": decoded_data['data']['owner_mail'],
                                "nft_id": decoded_data['data'].get('nft_id'),
                                "transaction_id": decoded_data['data'].get('transaction_id')
                            }
                        }
                    )
                else:
                    return JSONResponse(
                        content={
                            "success": True,
                            "message": "Data found but no ownership information",
                            "decoded_data": decoded_data
                        }
                    )
                    
            except jwt.ExpiredSignatureError:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"success": False, "message": "JWT token has expired"}
                )
            except jwt.InvalidTokenError as e:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"success": False, "message": f"Invalid JWT token: {str(e)}"}
                )
                
        except Exception as e:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"success": False, "message": f"Failed to extract hidden data: {str(e)}"}
            )
            
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": f"Error processing image: {str(e)}"}
        )


if __name__ == '__main__':
    PORT = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=PORT)
    
