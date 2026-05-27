from app.services.ai_service import generate_sql_query

query = generate_sql_query(
    "Create SQL query to fetch all employees with salary greater than 50000"
)

print(query)