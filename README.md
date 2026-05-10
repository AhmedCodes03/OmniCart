# OmniCart 🛍️
### An AI-Powered E-Commerce Recommender System

[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-blue)]()
[![Flask](https://img.shields.io/badge/Backend-Python%20Flask-green)]()
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB)]()
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4-purple)]()

---

## 📌 Project Overview
OmniCart is a full-stack, AI-powered e-commerce platform that uses
Machine Learning and Large Language Models to deliver personalized
product recommendations to customers. 
---

## 🗄️ Database Setup

Run the SQL scripts in this exact order:

```bash
# Step 1 - Create database and all 9 tables + views
mysql -u root -p < database/schema.sql

# Step 2 - Insert sample data
mysql -u root -p < database/seed.sql

# Step 3 - Create stored procedures
mysql -u root -p < database/procedures.sql
```

Or open MySQL Workbench and run each file via:
**File → Open SQL Script → Run (Ctrl+Shift+Enter)**

---

## 📁 Database Files

| File | Description |
|------|-------------|
| `database/schema.sql` | Creates all 9 tables + 3 views |
| `database/seed.sql` | Sample data for all tables |
| `database/procedures.sql` | 3 stored procedures (one per user role) |
| `database/queries.sql` | JOIN queries for all 3 user roles |

---

  
## ⚙️ Stored Procedures

| Procedure | Role | Description |
|-----------|------|-------------|
| `PlaceOrder` | Customer | Atomic order placement with stock deduction |
| `UpdateProductInventory` | Vendor | Safe stock + price update with ownership check |
| `DeactivateUser` | Admin | Deactivate account + cancel pending orders |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + Tailwind CSS |
| Backend | Python 3.11 + Flask |
| Database | MySQL 8.0 |
| ORM | SQLAlchemy |
| Auth | JWT (Flask-JWT-Extended) |
| AI/ML | OpenAI GPT-4 + Scikit-learn (SVD) |
| NLP | TextBlob / NLTK |
| Automation | n8n |
| Dataset | Amazon Product Reviews (Kaggle) |


