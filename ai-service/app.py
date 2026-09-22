import os
import joblib

from flask import Flask, request, jsonify


app = Flask(__name__)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


def load_model(filename):
    path = os.path.join(MODEL_DIR, filename)

    if not os.path.isfile(path):
        raise RuntimeError(
            f"Missing AI model: {filename}. Run train_model.py first."
        )

    return joblib.load(path)


category_model = load_model("category_model.pkl")
skill_model = load_model("skill_model.pkl")
difficulty_model = load_model("difficulty_model.pkl")


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "NexServe AI Service is running"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400

        description = data.get("description")

        if not isinstance(description, str) or not description.strip():
            return jsonify({
                "success": False,
                "message": "Job description is required"
            }), 400

        description = description.strip()

        if len(description) < 5:
            return jsonify({
                "success": False,
                "message": "Job description is too short"
            }), 400

        category = category_model.predict(
            [description]
        )[0]

        required_skill = skill_model.predict(
            [description]
        )[0]

        difficulty = difficulty_model.predict(
            [description]
        )[0]

        return jsonify({
            "success": True,
            "prediction": {
                "category": category,
                "requiredSkill": required_skill,
                "difficulty": difficulty
            }
        })

    except Exception as error:
        print("Prediction error:", error)

        return jsonify({
            "success": False,
            "message": "AI prediction failed"
        }), 500


@app.route("/price-estimate", methods=["POST"])
def price_estimate():
    data = request.get_json(silent=True) or {}
    category = str(data.get("category", "Other")).strip().lower()
    difficulty = str(data.get("difficulty", "Medium")).strip().lower()
    urgency = str(data.get("urgency", "normal")).strip().lower()
    bases = {
        "plumbing": (250, 500),
        "electrical": (250, 550),
        "carpentry": (300, 700),
        "painting": (500, 1200),
        "appliance repair": (300, 800),
        "masonry": (400, 1000),
    }
    minimum, maximum = bases.get(category, (200, 400))
    if difficulty == "easy": minimum, maximum = round(minimum * .8), round(maximum * .8)
    if difficulty == "hard": minimum, maximum = round(minimum * 1.5), round(maximum * 1.5)
    if urgency == "urgent": minimum, maximum = round(minimum * 1.25), round(maximum * 1.25)
    return jsonify({"success": True, "estimate": {"minPrice": minimum, "maxPrice": maximum, "confidence": .78}})


@app.route("/image-detect", methods=["POST"])
def image_detect():
    data = request.get_json(silent=True) or {}
    image_url = str(data.get("imageUrl", "")).strip()
    if not image_url:
        return jsonify({"success": False, "message": "Image URL is required"}), 400
    return jsonify({
        "success": True,
        "analysis": {
            "detectedProblem": "Image queued for technician review",
            "labels": ["service_request"],
            "confidence": .5,
            "provider": "ai-service"
        }
    })


@app.route("/fake-job", methods=["POST"])
def fake_job():
    data = request.get_json(silent=True) or {}
    text = f"{data.get('title', '')} {data.get('description', '')}".lower()
    signals = ["free money", "urgent transfer", "otp", "crypto", "password", "click this link"]
    matched = [signal for signal in signals if signal in text]
    score = clamp(.15 + len(matched) * .18, 0, .98)
    return jsonify({
        "success": True,
        "result": {
            "riskScore": round(score, 2),
            "isLikelyFake": score >= .5,
            "signals": matched
        }
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        debug=os.environ.get("FLASK_DEBUG") == "1"
    )
