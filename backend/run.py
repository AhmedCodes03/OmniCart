from app import create_app
from app.extensions import db
from sqlalchemy import text
import os

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        result = db.session.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        print(f"✅ Connected to DB. Tables found: {tables}")

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

    app.run(debug=True)