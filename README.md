
# Paperpath

A web application designed to help International Baccalaureate (IB) students track their past paper practice, organize by subject groups, and monitor their exam preparation progress.

## Features

- **User Authentication**: Secure login and registration system
- **Subject Management**: Add and manage your IB subjects
- **Paper Tracking**: Track which past papers you've completed across years (2019-2024)
- **Score Recording**: Record your scores for each completed paper
- **Score Analysis**: Visualize your performance with charts and statistics


### How to Use

1. Complete a past paper in the Paper Tracking tab
2. Click "Add score" next to any completed paper
3. Enter your score (0-100)
4. View detailed analysis in the "Score Analysis" tab

## Technical Implementation

- Frontend: React, Tailwind CSS, Chart.js
- Backend: FastAPI, PostgreSQL
- Authentication: JWT tokens

## Setup and Installation

Instructions for setting up the development environment...
=======
- **IB Subject Organization**: Subjects organized according to official IB groups
  - Group 1: Studies in Language and Literature
  - Group 2: Language Acquisition
  - Group 3: Individuals and Societies
  - Group 4: Sciences
  - Group 5: Mathematics
  - Group 6: The Arts
- **Paper Tracking**: Track completion status of past papers by:
  - Year (2019-2024)
  - Session (May and November)
  - Paper Type (Paper 1, 2, and 3)
- **Progress Monitoring**: Visual progress indicators and statistics
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Tailwind CSS for styling
- Axios for API requests

### Backend
- FastAPI (Python)
- PostgreSQL database
- JWT for authentication
- SQLAlchemy ORM

## Installation

### Prerequisites
- Node.js and npm
- Python 3.8+
- PostgreSQL

### Backend Setup
1. Clone the repository
   ```
   git clone https://github.com/yourusername/ib-paper-tracker.git
   cd ib-paper-tracker/backend
   ```

2. Create a virtual environment and install dependencies
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/db_name
   SECRET_KEY=your_secret_key
   ```

4. Initialize the database and run the server
   ```
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory
   ```
   cd ../frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory (if needed)
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```

4. Start the development server
   ```
   npm start
   ```

## Usage

1. Register a new account or login with existing credentials
2. Select your IB subjects from the organized subject groups
3. Track your progress on different past papers by marking them as completed
4. Monitor your overall progress through the completion statistics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

