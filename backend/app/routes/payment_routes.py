import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from core.config import settings
from db.dependencies import get_db
from sqlalchemy.orm import Session
from models.models import User

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY
endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

@router.post("/create-checkout-session")
async def create_checkout_session(request: Request):
    data = await request.json()
    user_id = data.get("user_id")

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID lipsă")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[
                {
                    "price": settings.STRIPE_PRICE_ID,
                    "quantity": 1,
                }
            ],
            metadata={"user_id": user_id},
            success_url="http://localhost:3000/profil?checkout=success",
            cancel_url="http://localhost:3000/profil?checkout=cancel",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook", response_model=None)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return {"error": "Invalid payload"}
    except stripe.error.SignatureVerificationError:
        return {"error": "Invalid signature"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        user_id = session.get("metadata", {}).get("user_id")
        subscription_id = session.get("subscription")  

        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.abonament = "PRO"
                user.subscription_id = subscription_id 
                db.commit()
                db.refresh(user)
    return {"status": "ok"}



@router.post("/cancel-subscription")
def cancel_subscription(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID lipsă")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.subscription_id:
        raise HTTPException(status_code=404, detail="Utilizatorul nu are abonament activ")

    try:
        stripe.Subscription.delete(user.subscription_id)
        user.abonament = "IMPLICIT"
        user.subscription_id = None
        db.commit()
        return {"message": "Abonamentul a fost anulat cu succes."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

