# backend/diet_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import json

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

app = Flask(__name__)
CORS(app)

class NLPDietRecommender:
    def __init__(self):
        self.meal_data = self._create_comprehensive_dataset()
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.ingredient_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
        self.nutrition_stop_words = {
            'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
            'ounce', 'ounces', 'gram', 'grams', 'kg', 'lb', 'pound', 'pounds',
            'slice', 'slices', 'piece', 'pieces', 'clove', 'cloves', 'pinch'
        }
        
        self._train_nlp_models()
        print("✅ NLP Diet Recommender initialized successfully!")
    
    def _create_comprehensive_dataset(self):
        """Create a comprehensive meal dataset"""
        meals = [
            {
                'id': 1, 'name': 'Greek Yogurt Protein Bowl', 'category': 'breakfast',
                'calories': 320, 'protein': 25, 'carbs': 30, 'fat': 10, 'fiber': 5,
                'description': "Creamy Greek yogurt mixed with fresh berries, honey drizzle, and crunchy almonds. High in protein and perfect for muscle recovery.",
                'ingredients': "plain greek yogurt, mixed berries, raw honey, sliced almonds, chia seeds",
                'prep_time': 5, 'cuisine': 'mediterranean', 'tags': 'high-protein vegetarian breakfast quick',
                'health_benefits': "Supports muscle growth, improves digestion, provides sustained energy"
            },
            {
                'id': 2, 'name': 'Grilled Chicken Power Salad', 'category': 'lunch',
                'calories': 450, 'protein': 40, 'carbs': 25, 'fat': 22, 'fiber': 8,
                'description': "Lean grilled chicken breast served over fresh mixed greens with avocado, cherry tomatoes, and light olive oil dressing. Excellent for weight management.",
                'ingredients': "chicken breast, mixed greens, avocado, cherry tomatoes, cucumber, olive oil, lemon juice",
                'prep_time': 15, 'cuisine': 'international', 'tags': 'high-protein low-carb gluten-free',
                'health_benefits': "Builds lean muscle, supports weight loss, provides essential nutrients"
            },
            {
                'id': 3, 'name': 'Avocado Egg Breakfast', 'category': 'breakfast',
                'calories': 380, 'protein': 20, 'carbs': 15, 'fat': 28, 'fiber': 12,
                'description': "Fresh avocado halves filled with perfectly cooked eggs, sprinkled with chili flakes and herbs. Keto-friendly and highly nutritious.",
                'ingredients': "avocado, eggs, chili flakes, fresh herbs, salt, pepper",
                'prep_time': 12, 'cuisine': 'international', 'tags': 'low-carb keto high-fiber',
                'health_benefits': "Supports heart health, provides healthy fats, promotes satiety"
            },
            {
                'id': 4, 'name': 'Quinoa Vegetable Buddha Bowl', 'category': 'lunch',
                'calories': 420, 'protein': 18, 'carbs': 55, 'fat': 16, 'fiber': 12,
                'description': "Nutrient-packed bowl with quinoa, roasted vegetables, chickpeas, and tahini dressing. Complete plant-based protein source.",
                'ingredients': "quinoa, sweet potato, broccoli, chickpeas, tahini, lemon juice, spices",
                'prep_time': 25, 'cuisine': 'mediterranean', 'tags': 'vegetarian vegan high-fiber',
                'health_benefits': "Complete protein source, rich in fiber, supports gut health"
            },
            {
                'id': 5, 'name': 'Protein Power Smoothie', 'category': 'snack',
                'calories': 280, 'protein': 30, 'carbs': 25, 'fat': 8, 'fiber': 6,
                'description': "Quick and easy protein smoothie with banana, spinach, and protein powder. Perfect for post-workout recovery.",
                'ingredients': "protein powder, banana, spinach, almond milk, peanut butter",
                'prep_time': 3, 'cuisine': 'international', 'tags': 'quick high-protein post-workout',
                'health_benefits': "Muscle recovery, quick energy, nutrient-dense"
            },
            {
                'id': 6, 'name': 'Salmon with Roasted Vegetables', 'category': 'dinner',
                'calories': 480, 'protein': 35, 'carbs': 20, 'fat': 28, 'fiber': 8,
                'description': "Oven-baked salmon fillet with roasted asparagus and sweet potatoes. Rich in omega-3 fatty acids and protein.",
                'ingredients': "salmon fillet, asparagus, sweet potato, olive oil, garlic, lemon",
                'prep_time': 25, 'cuisine': 'international', 'tags': 'high-protein omega-3 gluten-free',
                'health_benefits': "Heart health, brain function, anti-inflammatory"
            }
        ]
        return pd.DataFrame(meals)
    
    def _preprocess_text(self, text):
        """Advanced text preprocessing for nutritional content"""
        if pd.isna(text):
            return ""
        
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = word_tokenize(text)
        tokens = [token for token in tokens if token not in self.stop_words and token not in self.nutrition_stop_words]
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens]
        return ' '.join(tokens)
    
    def _train_nlp_models(self):
        """Train NLP models on meal data"""
        combined_text = (
            self.meal_data['description'] + ' ' + 
            self.meal_data['ingredients'] + ' ' + 
            self.meal_data['health_benefits'] + ' ' + 
            self.meal_data['tags']
        )
        
        processed_text = combined_text.apply(self._preprocess_text)
        self.tfidf_matrix = self.vectorizer.fit_transform(processed_text)
        
        # Train ingredient model
        self.ingredient_matrix = self.ingredient_vectorizer.fit_transform(self.meal_data['ingredients'])
        
        print("✅ NLP models trained successfully!")
    
    def content_based_recommendation(self, query, n_recommendations=5):
        """Content-based filtering using TF-IDF"""
        processed_query = self._preprocess_text(query)
        query_vector = self.vectorizer.transform([processed_query])
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
        top_indices = similarities.argsort()[-n_recommendations:][::-1]
        
        recommendations = []
        for idx in top_indices:
            meal = self.meal_data.iloc[idx].to_dict()
            meal['similarity_score'] = float(similarities[idx])
            recommendations.append(meal)
        
        return recommendations
    
    def ingredient_based_recommendation(self, available_ingredients, n_recommendations=5):
        """Recommend meals based on available ingredients"""
        if not available_ingredients:
            return []
            
        ingredients_text = ' '.join(available_ingredients)
        ingredients_vector = self.ingredient_vectorizer.transform([ingredients_text])
        similarities = cosine_similarity(ingredients_vector, self.ingredient_matrix).flatten()
        top_indices = similarities.argsort()[-n_recommendations:][::-1]
        
        recommendations = []
        for idx in top_indices:
            meal = self.meal_data.iloc[idx].to_dict()
            meal['ingredient_match_score'] = float(similarities[idx])
            recommendations.append(meal)
        
        return recommendations
    
    def hybrid_recommendation(self, query, available_ingredients=None, n_recommendations=5):
        """Hybrid recommendation combining multiple approaches"""
        content_recs = self.content_based_recommendation(query, n_recommendations * 2)
        ingredient_recs = self.ingredient_based_recommendation(available_ingredients, n_recommendations * 2) if available_ingredients else []
        
        all_recs = {}
        
        for rec in content_recs:
            meal_id = rec['id']
            all_recs[meal_id] = all_recs.get(meal_id, 0) + rec.get('similarity_score', 0) * 0.6
        
        for rec in ingredient_recs:
            meal_id = rec['id']
            all_recs[meal_id] = all_recs.get(meal_id, 0) + rec.get('ingredient_match_score', 0) * 0.4
        
        sorted_meals = sorted(all_recs.items(), key=lambda x: x[1], reverse=True)
        top_meal_ids = [meal_id for meal_id, score in sorted_meals[:n_recommendations]]
        
        final_recommendations = []
        for meal_id in top_meal_ids:
            meal = self.meal_data[self.meal_data['id'] == meal_id].iloc[0].to_dict()
            meal['hybrid_score'] = all_recs[meal_id]
            final_recommendations.append(meal)
        
        return final_recommendations

# Initialize the model
nlp_recommender = NLPDietRecommender()

@app.route('/diet/status')
def diet_status():
    return jsonify({
        "status": "NLP Diet Server Running",
        "meals_count": len(nlp_recommender.meal_data),
        "endpoints": [
            "/diet/recommend - POST - Get meal recommendations",
            "/diet/ingredients - POST - Get recipes by ingredients"
        ]
    })

@app.route('/diet/recommend', methods=['POST'])
def recommend_meals():
    try:
        data = request.get_json()
        query = data.get('query', '')
        ingredients = data.get('ingredients', [])
        method = data.get('method', 'hybrid')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        if method == 'content':
            recommendations = nlp_recommender.content_based_recommendation(query)
        elif method == 'ingredients':
            recommendations = nlp_recommender.ingredient_based_recommendation(ingredients)
        else:  # hybrid
            recommendations = nlp_recommender.hybrid_recommendation(query, ingredients)
        
        return jsonify({
            "success": True,
            "query": query,
            "method": method,
            "recommendations": recommendations,
            "count": len(recommendations)
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/diet/ingredients', methods=['POST'])
def recommend_by_ingredients():
    try:
        data = request.get_json()
        ingredients = data.get('ingredients', [])
        
        if not ingredients:
            return jsonify({"error": "Ingredients list is required"}), 400
        
        recommendations = nlp_recommender.ingredient_based_recommendation(ingredients)
        
        return jsonify({
            "success": True,
            "ingredients": ingredients,
            "recommendations": recommendations,
            "count": len(recommendations)
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting NLP Diet Recommendation Server on port 5002...")
    app.run(host='0.0.0.0', port=5002, debug=True)