import sys
import os
from datetime import datetime

# Add Backend folder to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import models
from app.db.session import SessionLocal, Base, engine
from app.services import auth_service

def seed_db():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        username = "admin"
        password = "password123"
        
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists. No seeding required.")
            return

        print(f"Creating default user '{username}'...")
        hashed_pwd = auth_service.get_password_hash(password)
        user = models.User(username=username, password_hash=hashed_pwd)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print("Seeding folders for 'admin'...")
        default_folders = [
            ("labor", "Labor Law"),
            ("civil", "Civil Law"),
            ("criminal", "Criminal Law"),
            ("contracts", "Contracts")
        ]
        for fid, fname in default_folders:
            folder = models.ChatFolder(id=fid, name=fname, user_id=user.id)
            db.add(folder)
            
        print("Seeding welcome chat and message...")
        default_chat_id = "c-welcome"
        welcome_chat = models.Chat(id=default_chat_id, title="Welcome Conversation", folder_id="contracts", user_id=user.id)
        db.add(welcome_chat)
        
        welcome_msg = models.Message(
            id="m-welcome",
            chat_id=default_chat_id,
            role="assistant",
            content="Welcome to GovDoc Intellisense! Upload a PDF document and ask your legal questions.",
            created_at=datetime.utcnow()
        )
        db.add(welcome_msg)
        
        db.commit()
        print("\nDatabase seeded successfully!")
        print("=============================")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print("=============================")
        
    except Exception as e:
        print(f"Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
