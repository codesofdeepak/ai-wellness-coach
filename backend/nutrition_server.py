# backend/nutrition_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json



app = Flask(__name__)
CORS(app)

class NutritionTracker:
    def __init__(self):
        # You can get free API keys from:
        # - Edamam: https://developer.edamam.com/food-database-api
        # - Nutritionix: https://developer.nutritionix.com/
        # - Spoonacular: https://spoonacular.com/food-api
        self.api_keys = {
            'edamam_app_id': os.getenv('EDAMAM_APP_ID', 'demo'),
            'edamam_app_key': os.getenv('EDAMAM_APP_KEY', 'demo'),
            'nutritionix_app_id': os.getenv('NUTRITIONIX_APP_ID', 'demo'),
            'nutritionix_app_key': os.getenv('NUTRITIONIX_APP_KEY', 'demo')
        }
        self.cache = {}  # Simple cache to avoid repeated API calls
        print("✅ Nutrition Tracker initialized successfully!")
    
    def search_food(self, query):
        """Search for food nutrition using multiple API fallbacks"""
        query = query.lower().strip()
        
        # Check cache first
        if query in self.cache:
            return self.cache[query]
        
        # Try Edamam API first
        result = self._search_edamam(query)
        if not result:
            # Fallback to Nutritionix API
            result = self._search_nutritionix(query)
        
        if not result:
            # Final fallback to our local database
            result = self._search_local_database(query)
        
        # Cache the result
        if result:
            self.cache[query] = result
        
        return result
    
    def _search_edamam(self, query):
        """Search using Edamam Food Database API"""
        try:
            url = "https://api.edamam.com/api/food-database/v2/parser"
            params = {
                'app_id': self.api_keys['edamam_app_id'],
                'app_key': self.api_keys['edamam_app_key'],
                'ingr': query,
                'nutrition-type': 'cooking'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('hints'):
                    food = data['hints'][0]['food']
                    nutrients = food.get('nutrients', {})
                    
                    return {
                        'name': food.get('label', query),
                        'category': food.get('category', 'generic'),
                        'serving_size': '100g',
                        'calories': nutrients.get('ENERC_KCAL', 0),
                        'protein': nutrients.get('PROCNT', 0),
                        'carbs': nutrients.get('CHOCDF', 0),
                        'fat': nutrients.get('FAT', 0),
                        'fiber': nutrients.get('FIBTG', 0),
                        'sugar': nutrients.get('SUGAR', 0),
                        'source': 'edamam'
                    }
        except Exception as e:
            print(f"Edamam API error: {e}")
        
        return None
    
    def _search_nutritionix(self, query):
        """Search using Nutritionix API"""
        try:
            url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
            headers = {
                'x-app-id': self.api_keys['nutritionix_app_id'],
                'x-app-key': self.api_keys['nutritionix_app_key'],
                'Content-Type': 'application/json'
            }
            data = {
                'query': query
            }
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('foods'):
                    food = data['foods'][0]
                    
                    return {
                        'name': food.get('food_name', query),
                        'category': food.get('food_type', 'generic'),
                        'serving_size': food.get('serving_unit', '100g'),
                        'calories': food.get('nf_calories', 0),
                        'protein': food.get('nf_protein', 0),
                        'carbs': food.get('nf_total_carbohydrate', 0),
                        'fat': food.get('nf_total_fat', 0),
                        'fiber': food.get('nf_dietary_fiber', 0),
                        'sugar': food.get('nf_sugars', 0),
                        'source': 'nutritionix'
                    }
        except Exception as e:
            print(f"Nutritionix API error: {e}")
        
        return None
    
    def _search_local_database(self, query):
        """Fallback to local database for common foods"""
        local_foods = {
            # Common foods with average nutritional values
            'apple': {'name': 'Apple', 'category': 'fruit', 'serving_size': '1 medium (182g)',
                     'calories': 95, 'protein': 0.5, 'carbs': 25, 'fat': 0.3, 'fiber': 4.4, 'sugar': 19, 'source': 'local'},
            'banana': {'name': 'Banana', 'category': 'fruit', 'serving_size': '1 medium (118g)',
                      'calories': 105, 'protein': 1.3, 'carbs': 27, 'fat': 0.4, 'fiber': 3.1, 'sugar': 14, 'source': 'local'},
            'chicken breast': {'name': 'Chicken Breast', 'category': 'protein', 'serving_size': '100g',
                             'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'fiber': 0, 'sugar': 0, 'source': 'local'},
            'rice': {'name': 'White Rice', 'category': 'grains', 'serving_size': '1 cup cooked (158g)',
                    'calories': 205, 'protein': 4.3, 'carbs': 45, 'fat': 0.4, 'fiber': 0.6, 'sugar': 0.1, 'source': 'local'},
            'broccoli': {'name': 'Broccoli', 'category': 'vegetable', 'serving_size': '1 cup (91g)',
                       'calories': 31, 'protein': 2.5, 'carbs': 6, 'fat': 0.3, 'fiber': 2.4, 'sugar': 1.5, 'source': 'local'},
            'egg': {'name': 'Egg', 'category': 'protein', 'serving_size': '1 large (50g)',
                   'calories': 78, 'protein': 6, 'carbs': 0.6, 'fat': 5, 'fiber': 0, 'sugar': 0.6, 'source': 'local'},
            'milk': {'name': 'Whole Milk', 'category': 'dairy', 'serving_size': '1 cup (244g)',
                    'calories': 149, 'protein': 8, 'carbs': 12, 'fat': 8, 'fiber': 0, 'sugar': 12, 'source': 'local'},
            'bread': {'name': 'Whole Wheat Bread', 'category': 'grains', 'serving_size': '1 slice (28g)',
                     'calories': 81, 'protein': 4, 'carbs': 14, 'fat': 1, 'fiber': 2, 'sugar': 2, 'source': 'local'},
            'pasta': {'name': 'Pasta', 'category': 'grains', 'serving_size': '1 cup cooked (140g)',
                     'calories': 221, 'protein': 8, 'carbs': 43, 'fat': 1.3, 'fiber': 2.5, 'sugar': 0.8, 'source': 'local'},
            'salmon': {'name': 'Salmon', 'category': 'seafood', 'serving_size': '100g',
                      'calories': 208, 'protein': 20, 'carbs': 0, 'fat': 13, 'fiber': 0, 'sugar': 0, 'source': 'local'},
            'yogurt': {'name': 'Greek Yogurt', 'category': 'dairy', 'serving_size': '100g',
                      'calories': 59, 'protein': 10, 'carbs': 3.6, 'fat': 0.4, 'fiber': 0, 'sugar': 3.2, 'source': 'local'},
            'avocado': {'name': 'Avocado', 'category': 'fruit', 'serving_size': '1 medium (201g)',
                       'calories': 322, 'protein': 4, 'carbs': 17, 'fat': 29, 'fiber': 13, 'sugar': 1.3, 'source': 'local'},
            'potato': {'name': 'Potato', 'category': 'vegetable', 'serving_size': '1 medium (173g)',
                      'calories': 161, 'protein': 4.3, 'carbs': 37, 'fat': 0.2, 'fiber': 3.8, 'sugar': 1.9, 'source': 'local'},
            'carrot': {'name': 'Carrot', 'category': 'vegetable', 'serving_size': '1 medium (61g)',
                      'calories': 25, 'protein': 0.6, 'carbs': 6, 'fat': 0.1, 'fiber': 1.7, 'sugar': 3.4, 'source': 'local'},
            'beef': {'name': 'Beef Steak', 'category': 'protein', 'serving_size': '100g',
                    'calories': 271, 'protein': 25, 'carbs': 0, 'fat': 19, 'fiber': 0, 'sugar': 0, 'source': 'local'},
        }
        
        # Fuzzy matching for local database
        query_lower = query.lower()
        for food_name, food_data in local_foods.items():
            if food_name in query_lower or query_lower in food_name:
                return food_data
        
        # If no exact match, return generic response
        return {
            'name': query.title(),
            'category': 'generic',
            'serving_size': '100g',
            'calories': 0,
            'protein': 0,
            'carbs': 0,
            'fat': 0,
            'fiber': 0,
            'sugar': 0,
            'source': 'estimated',
            'note': 'Nutritional information not available. Please try a more specific food name.'
        }
    
    def analyze_meal(self, food_items):
        """Analyze multiple food items for total nutrition"""
        total_nutrition = {
            'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 
            'fiber': 0, 'sugar': 0, 'foods': []
        }
        
        for food_item in food_items:
            nutrition = self.search_food(food_item)
            if nutrition:
                total_nutrition['calories'] += nutrition.get('calories', 0)
                total_nutrition['protein'] += nutrition.get('protein', 0)
                total_nutrition['carbs'] += nutrition.get('carbs', 0)
                total_nutrition['fat'] += nutrition.get('fat', 0)
                total_nutrition['fiber'] += nutrition.get('fiber', 0)
                total_nutrition['sugar'] += nutrition.get('sugar', 0)
                total_nutrition['foods'].append(nutrition)
        
        return total_nutrition

# Initialize the tracker
nutrition_tracker = NutritionTracker()

@app.route('/nutrition/status')
def nutrition_status():
    return jsonify({
        "status": "Nutrition Tracker Server Running",
        "message": "Can analyze any food item using multiple data sources"
    })

@app.route('/nutrition/search', methods=['POST'])
def search_food():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({"error": "Food query is required"}), 400
        
        result = nutrition_tracker.search_food(query)
        
        if result:
            return jsonify({
                "success": True,
                "query": query,
                "nutrition": result
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Could not find nutrition data for '{query}'"
            }), 404
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/nutrition/analyze-meal', methods=['POST'])
def analyze_meal():
    try:
        data = request.get_json()
        food_items = data.get('food_items', [])
        
        if not food_items:
            return jsonify({"error": "Food items list is required"}), 400
        
        analysis = nutrition_tracker.analyze_meal(food_items)
        
        return jsonify({
            "success": True,
            "food_count": len(food_items),
            "total_nutrition": analysis
        })
    

    
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Nutrition Tracker Server on port 5003...")
    app.run(host='0.0.0.0', port=5003, debug=True)