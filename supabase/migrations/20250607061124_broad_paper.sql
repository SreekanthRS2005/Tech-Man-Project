/*
  # Populate Assessment Platform with Sample Data
  
  1. Sample Data Added
    - 20 general aptitude questions for Round 1
    - 10 technical questions per domain (7 domains = 70 total)
    - 4 coding problems per domain (7 domains = 28 total)
    
  2. Question Distribution
    - Aptitude: 3 marks each (30% total weight)
    - Technical MCQs: 7 marks each (35% total weight)
    - Coding Problems: 17.5 marks each (35% total weight)
    
  3. Domains Covered
    - Java, Python, JavaScript, Full Stack Development
    - Data Analytics, Machine Learning, Automation Testing
*/

-- Insert sample aptitude questions
INSERT INTO questions (question_type, question_text, options, correct_answer, marks) VALUES
('aptitude', 'If a train travels 120 km in 2 hours, what is its average speed?', '["50 km/h", "60 km/h", "70 km/h", "80 km/h"]', '60 km/h', 3),
('aptitude', 'What comes next in the sequence: 2, 6, 12, 20, 30, ?', '["40", "42", "44", "46"]', '42', 3),
('aptitude', 'If 5 workers can complete a task in 8 days, how many days will 10 workers take?', '["2 days", "4 days", "6 days", "8 days"]', '4 days', 3),
('aptitude', 'What is 15% of 240?', '["30", "36", "40", "45"]', '36', 3),
('aptitude', 'A cube has 6 faces. How many edges does it have?', '["8", "10", "12", "14"]', '12', 3),
('aptitude', 'If today is Wednesday, what day will it be after 100 days?', '["Monday", "Tuesday", "Wednesday", "Friday"]', 'Friday', 3),
('aptitude', 'What is the next number: 1, 4, 9, 16, 25, ?', '["30", "36", "40", "49"]', '36', 3),
('aptitude', 'A clock shows 3:15. What is the angle between the hour and minute hands?', '["0°", "7.5°", "15°", "22.5°"]', '7.5°', 3),
('aptitude', 'If A = 1, B = 2, C = 3, what is the value of HELLO?', '["52", "64", "72", "80"]', '52', 3),
('aptitude', 'What is the missing number: 3, 7, 15, 31, ?', '["47", "55", "63", "71"]', '63', 3),
('aptitude', 'A person buys a book for $20 and sells it for $25. What is the profit percentage?', '["20%", "25%", "30%", "35%"]', '25%', 3),
('aptitude', 'What is the sum of angles in a triangle?', '["90°", "180°", "270°", "360°"]', '180°', 3),
('aptitude', 'If 2x + 5 = 15, what is the value of x?', '["3", "5", "7", "10"]', '5', 3),
('aptitude', 'What is the capital of Australia?', '["Sydney", "Melbourne", "Canberra", "Perth"]', 'Canberra', 3),
('aptitude', 'How many seconds are there in 2 hours?', '["3600", "7200", "10800", "14400"]', '7200', 3),
('aptitude', 'What is the square root of 144?', '["10", "11", "12", "13"]', '12', 3),
('aptitude', 'If a rectangle has length 8 and width 6, what is its area?', '["42", "48", "54", "60"]', '48', 3),
('aptitude', 'What is 2^5?', '["16", "24", "32", "40"]', '32', 3),
('aptitude', 'A bag contains 5 red and 3 blue balls. What is the probability of drawing a red ball?', '["3/8", "5/8", "3/5", "5/3"]', '5/8', 3),
('aptitude', 'What is the next prime number after 17?', '["18", "19", "20", "21"]', '19', 3);

-- Get domain IDs for reference
DO $$
DECLARE
    java_id UUID;
    python_id UUID;
    js_id UUID;
    fullstack_id UUID;
    data_id UUID;
    ml_id UUID;
    testing_id UUID;
BEGIN
    SELECT id INTO java_id FROM domains WHERE name = 'Java';
    SELECT id INTO python_id FROM domains WHERE name = 'Python';
    SELECT id INTO js_id FROM domains WHERE name = 'JavaScript';
    SELECT id INTO fullstack_id FROM domains WHERE name = 'Full Stack Development';
    SELECT id INTO data_id FROM domains WHERE name = 'Data Analytics';
    SELECT id INTO ml_id FROM domains WHERE name = 'Machine Learning';
    SELECT id INTO testing_id FROM domains WHERE name = 'Automation Testing';

    -- Java technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (java_id, 'technical', 'Which of the following is NOT a Java keyword?', '["static", "final", "goto", "const"]', 'const', 7),
    (java_id, 'technical', 'What is the default value of a boolean variable in Java?', '["true", "false", "null", "0"]', 'false', 7),
    (java_id, 'technical', 'Which method is called when an object is garbage collected?', '["finalize()", "delete()", "destroy()", "clean()"]', 'finalize()', 7),
    (java_id, 'technical', 'What is the size of int in Java?', '["16 bits", "32 bits", "64 bits", "Platform dependent"]', '32 bits', 7),
    (java_id, 'technical', 'Which collection class allows duplicate elements?', '["Set", "Map", "List", "Queue"]', 'List', 7),
    (java_id, 'technical', 'What is the parent class of all classes in Java?', '["Class", "Object", "Super", "Parent"]', 'Object', 7),
    (java_id, 'technical', 'Which keyword is used to prevent inheritance?', '["final", "static", "private", "protected"]', 'final', 7),
    (java_id, 'technical', 'What is the correct way to create a thread in Java?', '["Extend Thread class", "Implement Runnable", "Both A and B", "None"]', 'Both A and B', 7),
    (java_id, 'technical', 'Which exception is thrown when array index is out of bounds?', '["IndexOutOfBoundsException", "ArrayIndexOutOfBoundsException", "OutOfBoundsException", "IndexException"]', 'ArrayIndexOutOfBoundsException', 7),
    (java_id, 'technical', 'What is the difference between == and equals()?', '["No difference", "== compares references, equals() compares content", "== compares content, equals() compares references", "Both compare content"]', '== compares references, equals() compares content', 7);

    -- Python technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (python_id, 'technical', 'Which of the following is mutable in Python?', '["tuple", "string", "list", "frozenset"]', 'list', 7),
    (python_id, 'technical', 'What is the output of print(type([]))?', '["<class tuple>", "<class list>", "<class dict>", "<class set>"]', '<class list>', 7),
    (python_id, 'technical', 'Which keyword is used to define a function in Python?', '["function", "def", "define", "func"]', 'def', 7),
    (python_id, 'technical', 'What is the correct way to create a dictionary?', '["dict = []", "dict = {}", "dict = ()", "dict = \"\""]', 'dict = {}', 7),
    (python_id, 'technical', 'Which method is used to add an element to a list?', '["add()", "append()", "insert()", "push()"]', 'append()', 7),
    (python_id, 'technical', 'What is the output of 2 ** 3 in Python?', '["5", "6", "8", "9"]', '8', 7),
    (python_id, 'technical', 'Which of the following is used for comments in Python?', '["//", "/* */", "#", "<!-- -->"]', '#', 7),
    (python_id, 'technical', 'What is the correct way to handle exceptions in Python?', '["try-catch", "try-except", "catch-finally", "handle-error"]', 'try-except', 7),
    (python_id, 'technical', 'Which function is used to get the length of a list?', '["length()", "size()", "len()", "count()"]', 'len()', 7),
    (python_id, 'technical', 'What is the output of bool(0) in Python?', '["True", "False", "0", "None"]', 'False', 7);

    -- JavaScript technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (js_id, 'technical', 'Which of the following is NOT a JavaScript data type?', '["undefined", "boolean", "float", "symbol"]', 'float', 7),
    (js_id, 'technical', 'What is the correct way to declare a variable in ES6?', '["var x", "let x", "const x", "Both let and const"]', 'Both let and const', 7),
    (js_id, 'technical', 'Which method is used to add an element to the end of an array?', '["push()", "add()", "append()", "insert()"]', 'push()', 7),
    (js_id, 'technical', 'What is the output of typeof null?', '["null", "undefined", "object", "boolean"]', 'object', 7),
    (js_id, 'technical', 'Which operator is used for strict equality?', '["==", "===", "=", "!="]', '===', 7),
    (js_id, 'technical', 'What is a closure in JavaScript?', '["A loop", "A function with access to outer scope", "An object", "A variable"]', 'A function with access to outer scope', 7),
    (js_id, 'technical', 'Which method is used to convert JSON string to object?', '["JSON.parse()", "JSON.stringify()", "JSON.convert()", "JSON.object()"]', 'JSON.parse()', 7),
    (js_id, 'technical', 'What is the correct way to create a promise?', '["new Promise()", "Promise.create()", "createPromise()", "Promise.new()"]', 'new Promise()', 7),
    (js_id, 'technical', 'Which keyword is used to define a class in ES6?', '["class", "Class", "function", "object"]', 'class', 7),
    (js_id, 'technical', 'What is the output of 1 + "1" in JavaScript?', '["2", "11", "1", "Error"]', '11', 7);

    -- Full Stack Development technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (fullstack_id, 'technical', 'Which HTTP method is used to update a resource?', '["GET", "POST", "PUT", "DELETE"]', 'PUT', 7),
    (fullstack_id, 'technical', 'What does REST stand for?', '["Representational State Transfer", "Remote State Transfer", "Relational State Transfer", "Resource State Transfer"]', 'Representational State Transfer', 7),
    (fullstack_id, 'technical', 'Which status code indicates a successful HTTP request?', '["200", "404", "500", "301"]', '200', 7),
    (fullstack_id, 'technical', 'What is the purpose of middleware in web applications?', '["Database connection", "Request/Response processing", "UI rendering", "File storage"]', 'Request/Response processing', 7),
    (fullstack_id, 'technical', 'Which database type is MongoDB?', '["Relational", "NoSQL", "Graph", "Key-Value"]', 'NoSQL', 7),
    (fullstack_id, 'technical', 'What is the purpose of CORS?', '["Cross-Origin Resource Sharing", "Cross-Origin Request Security", "Cross-Origin Response Sharing", "Cross-Origin Resource Security"]', 'Cross-Origin Resource Sharing', 7),
    (fullstack_id, 'technical', 'Which tool is commonly used for API testing?', '["Postman", "Git", "Docker", "Jenkins"]', 'Postman', 7),
    (fullstack_id, 'technical', 'What is the purpose of JWT?', '["Database queries", "Authentication tokens", "CSS styling", "Image processing"]', 'Authentication tokens', 7),
    (fullstack_id, 'technical', 'Which protocol is used for real-time communication?', '["HTTP", "FTP", "WebSocket", "SMTP"]', 'WebSocket', 7),
    (fullstack_id, 'technical', 'What is the purpose of a load balancer?', '["Distribute traffic", "Store data", "Process images", "Send emails"]', 'Distribute traffic', 7);

    -- Data Analytics technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (data_id, 'technical', 'Which Python library is commonly used for data manipulation?', '["NumPy", "Pandas", "Matplotlib", "Seaborn"]', 'Pandas', 7),
    (data_id, 'technical', 'What does SQL stand for?', '["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"]', 'Structured Query Language', 7),
    (data_id, 'technical', 'Which chart type is best for showing correlation?', '["Bar chart", "Pie chart", "Scatter plot", "Line chart"]', 'Scatter plot', 7),
    (data_id, 'technical', 'What is the purpose of data normalization?', '["Increase data size", "Standardize data ranges", "Delete data", "Encrypt data"]', 'Standardize data ranges', 7),
    (data_id, 'technical', 'Which measure indicates the spread of data?', '["Mean", "Median", "Mode", "Standard deviation"]', 'Standard deviation', 7),
    (data_id, 'technical', 'What is a primary key in a database?', '["Foreign reference", "Unique identifier", "Data type", "Index type"]', 'Unique identifier', 7),
    (data_id, 'technical', 'Which SQL clause is used to filter rows?', '["SELECT", "FROM", "WHERE", "ORDER BY"]', 'WHERE', 7),
    (data_id, 'technical', 'What is the purpose of data cleaning?', '["Increase data volume", "Remove inconsistencies", "Add more columns", "Change data types"]', 'Remove inconsistencies', 7),
    (data_id, 'technical', 'Which visualization tool is popular for business intelligence?', '["Excel", "Tableau", "Word", "PowerPoint"]', 'Tableau', 7),
    (data_id, 'technical', 'What is a data warehouse?', '["Real-time database", "Centralized data repository", "Data cleaning tool", "Visualization software"]', 'Centralized data repository', 7);

    -- Machine Learning technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (ml_id, 'technical', 'Which algorithm is used for classification?', '["Linear Regression", "Decision Tree", "K-Means", "PCA"]', 'Decision Tree', 7),
    (ml_id, 'technical', 'What is overfitting in machine learning?', '["Model performs well on training data only", "Model performs poorly", "Model is too simple", "Model has no bias"]', 'Model performs well on training data only', 7),
    (ml_id, 'technical', 'Which library is commonly used for machine learning in Python?', '["Pandas", "NumPy", "Scikit-learn", "Matplotlib"]', 'Scikit-learn', 7),
    (ml_id, 'technical', 'What is the purpose of cross-validation?', '["Data cleaning", "Model evaluation", "Feature selection", "Data visualization"]', 'Model evaluation', 7),
    (ml_id, 'technical', 'Which algorithm is used for clustering?', '["Linear Regression", "Logistic Regression", "K-Means", "Decision Tree"]', 'K-Means', 7),
    (ml_id, 'technical', 'What is a neural network?', '["Database structure", "Network of interconnected nodes", "Web framework", "Data format"]', 'Network of interconnected nodes', 7),
    (ml_id, 'technical', 'Which metric is used for regression evaluation?', '["Accuracy", "Precision", "Mean Squared Error", "F1-Score"]', 'Mean Squared Error', 7),
    (ml_id, 'technical', 'What is feature engineering?', '["Model training", "Creating new features from existing data", "Data visualization", "Model deployment"]', 'Creating new features from existing data', 7),
    (ml_id, 'technical', 'Which type of learning uses labeled data?', '["Supervised", "Unsupervised", "Reinforcement", "Semi-supervised"]', 'Supervised', 7),
    (ml_id, 'technical', 'What is gradient descent?', '["Clustering algorithm", "Optimization algorithm", "Classification algorithm", "Regression algorithm"]', 'Optimization algorithm', 7);

    -- Automation Testing technical questions
    INSERT INTO questions (domain_id, question_type, question_text, options, correct_answer, marks) VALUES
    (testing_id, 'technical', 'Which tool is used for web automation testing?', '["Selenium", "JUnit", "Maven", "Git"]', 'Selenium', 7),
    (testing_id, 'technical', 'What is the purpose of unit testing?', '["Test individual components", "Test entire application", "Test user interface", "Test database"]', 'Test individual components', 7),
    (testing_id, 'technical', 'Which framework is used for behavior-driven development?', '["JUnit", "TestNG", "Cucumber", "Mockito"]', 'Cucumber', 7),
    (testing_id, 'technical', 'What is a test case?', '["Testing tool", "Set of conditions to verify functionality", "Bug report", "Test environment"]', 'Set of conditions to verify functionality', 7),
    (testing_id, 'technical', 'Which type of testing verifies system integration?', '["Unit testing", "Integration testing", "System testing", "Acceptance testing"]', 'Integration testing', 7),
    (testing_id, 'technical', 'What is regression testing?', '["Testing new features", "Re-testing after changes", "Performance testing", "Security testing"]', 'Re-testing after changes', 7),
    (testing_id, 'technical', 'Which tool is used for API testing?', '["Selenium", "Postman", "JMeter", "LoadRunner"]', 'Postman', 7),
    (testing_id, 'technical', 'What is the purpose of mock objects?', '["Real database connection", "Simulate dependencies", "Store test data", "Generate reports"]', 'Simulate dependencies', 7),
    (testing_id, 'technical', 'Which testing approach tests from user perspective?', '["White box", "Black box", "Gray box", "Unit testing"]', 'Black box', 7),
    (testing_id, 'technical', 'What is continuous integration?', '["Manual testing", "Automated build and test", "Code review", "Bug tracking"]', 'Automated build and test', 7);

    -- Java coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (java_id, 'Reverse String', 'Write a Java method to reverse a given string without using built-in reverse methods.', '[{"input": "hello", "expected_output": "olleh"}, {"input": "world", "expected_output": "dlrow"}]', 'easy', 17),
    (java_id, 'Find Maximum', 'Write a Java method to find the maximum element in an integer array.', '[{"input": "[1, 5, 3, 9, 2]", "expected_output": "9"}, {"input": "[10, 20, 5]", "expected_output": "20"}]', 'easy', 17),
    (java_id, 'Palindrome Check', 'Write a Java method to check if a given string is a palindrome.', '[{"input": "racecar", "expected_output": "true"}, {"input": "hello", "expected_output": "false"}]', 'medium', 17),
    (java_id, 'Fibonacci Series', 'Write a Java method to generate the nth Fibonacci number.', '[{"input": "5", "expected_output": "5"}, {"input": "8", "expected_output": "21"}]', 'medium', 17);

    -- Python coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (python_id, 'List Sum', 'Write a Python function to calculate the sum of all elements in a list.', '[{"input": "[1, 2, 3, 4, 5]", "expected_output": "15"}, {"input": "[10, 20, 30]", "expected_output": "60"}]', 'easy', 17),
    (python_id, 'Count Vowels', 'Write a Python function to count the number of vowels in a given string.', '[{"input": "hello", "expected_output": "2"}, {"input": "programming", "expected_output": "3"}]', 'easy', 17),
    (python_id, 'Prime Check', 'Write a Python function to check if a given number is prime.', '[{"input": "7", "expected_output": "True"}, {"input": "10", "expected_output": "False"}]', 'medium', 17),
    (python_id, 'Dictionary Merge', 'Write a Python function to merge two dictionaries.', '[{"input": "{\"a\": 1, \"b\": 2}, {\"c\": 3, \"d\": 4}", "expected_output": "{\"a\": 1, \"b\": 2, \"c\": 3, \"d\": 4}"}]', 'medium', 17);

    -- JavaScript coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (js_id, 'Array Filter', 'Write a JavaScript function to filter even numbers from an array.', '[{"input": "[1, 2, 3, 4, 5, 6]", "expected_output": "[2, 4, 6]"}, {"input": "[1, 3, 5]", "expected_output": "[]"}]', 'easy', 17),
    (js_id, 'Object Property Sum', 'Write a JavaScript function to sum all numeric values in an object.', '[{"input": "{a: 1, b: 2, c: 3}", "expected_output": "6"}, {"input": "{x: 10, y: 20}", "expected_output": "30"}]', 'easy', 17),
    (js_id, 'Async Function', 'Write a JavaScript async function that returns a promise resolving after 1 second.', '[{"input": "", "expected_output": "Promise resolved after 1 second"}]', 'medium', 17),
    (js_id, 'DOM Manipulation', 'Write a JavaScript function to change the text content of an element by ID.', '[{"input": "elementId, newText", "expected_output": "Element text changed successfully"}]', 'medium', 17);

    -- Full Stack coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (fullstack_id, 'REST API Endpoint', 'Design a REST API endpoint structure for a user management system.', '[{"input": "GET /users", "expected_output": "Returns list of users"}, {"input": "POST /users", "expected_output": "Creates new user"}]', 'medium', 17),
    (fullstack_id, 'Database Query', 'Write a SQL query to find users who registered in the last 30 days.', '[{"input": "users table with registration_date", "expected_output": "SELECT * FROM users WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)"}]', 'medium', 17),
    (fullstack_id, 'Authentication Middleware', 'Write a middleware function to verify JWT tokens.', '[{"input": "JWT token", "expected_output": "Token verification result"}]', 'hard', 17),
    (fullstack_id, 'API Rate Limiting', 'Implement a rate limiting mechanism for API endpoints.', '[{"input": "Request count and time window", "expected_output": "Rate limit enforcement"}]', 'hard', 17);

    -- Data Analytics coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (data_id, 'Data Cleaning', 'Write a Python function to remove null values and duplicates from a dataset.', '[{"input": "DataFrame with nulls and duplicates", "expected_output": "Clean DataFrame"}]', 'easy', 17),
    (data_id, 'Statistical Analysis', 'Calculate mean, median, and standard deviation for a numeric column.', '[{"input": "[1, 2, 3, 4, 5]", "expected_output": "mean: 3, median: 3, std: 1.58"}]', 'easy', 17),
    (data_id, 'Data Visualization', 'Create a bar chart showing sales by category using matplotlib.', '[{"input": "Sales data by category", "expected_output": "Bar chart visualization"}]', 'medium', 17),
    (data_id, 'SQL Aggregation', 'Write a SQL query to find top 5 customers by total purchase amount.', '[{"input": "orders and customers tables", "expected_output": "Top 5 customers with total amounts"}]', 'medium', 17);

    -- Machine Learning coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (ml_id, 'Linear Regression', 'Implement a simple linear regression model using scikit-learn.', '[{"input": "Training data X, y", "expected_output": "Trained model with predictions"}]', 'medium', 17),
    (ml_id, 'Data Preprocessing', 'Write a function to normalize features and handle missing values.', '[{"input": "Raw dataset", "expected_output": "Preprocessed dataset"}]', 'easy', 17),
    (ml_id, 'Model Evaluation', 'Calculate accuracy, precision, and recall for a classification model.', '[{"input": "y_true, y_pred", "expected_output": "Accuracy: 0.85, Precision: 0.80, Recall: 0.90"}]', 'medium', 17),
    (ml_id, 'Feature Selection', 'Implement a function to select top k features based on correlation.', '[{"input": "Feature matrix and target", "expected_output": "Selected features"}]', 'hard', 17);

    -- Automation Testing coding problems
    INSERT INTO coding_problems (domain_id, title, description, test_cases, difficulty, marks) VALUES
    (testing_id, 'Selenium Test', 'Write a Selenium test to verify login functionality.', '[{"input": "Login page URL", "expected_output": "Successful login verification"}]', 'medium', 17),
    (testing_id, 'Unit Test', 'Write unit tests for a calculator class with add, subtract methods.', '[{"input": "Calculator class", "expected_output": "Comprehensive unit tests"}]', 'easy', 17),
    (testing_id, 'API Test', 'Write an automated test to verify REST API response structure.', '[{"input": "API endpoint", "expected_output": "Response validation"}]', 'medium', 17),
    (testing_id, 'Test Data Generator', 'Create a function to generate test data for user registration.', '[{"input": "User schema", "expected_output": "Generated test users"}]', 'easy', 17);

END $$;