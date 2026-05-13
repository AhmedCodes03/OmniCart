from ..extensions import db

class Category(db.Model):
    __tablename__ = "categories"

    # Attributes
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parent_category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id", ondelete="SET NULL", onupdate="CASCADE"), nullable=True)

    # Self-referential Relationship
    parent = db.relationship("Category", remote_side=[category_id], back_populates="subcategories")
    subcategories = db.relationship("Category", back_populates="parent")
    products = db.relationship("Product", back_populates="category")

    def __init__(self, **kwargs):
        super(Category, self).__init__(**kwargs)

    def to_dict(self):
        return {
            "category_id": self.category_id,
            "name": self.name,
            "description": self.description,
            "parent_category_id": self.parent_category_id
        }