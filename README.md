# Online Judge Backend

A robust and scalable backend service for an online coding platform that supports code execution in multiple programming languages, problem management, user authentication, and competition features.

## Features

- **Code Execution**: Execute and submit code in multiple programming languages
- **User Authentication**: JWT-based authentication system
- **Problem Management**: CRUD operations for coding problems
- **Competitions**: Support for coding competitions with leaderboards
- **Submission System**: Track and evaluate code submissions
- **Rate Limiting**: Built-in protection against abuse
- **Queue System**: Job queue for handling code execution requests
- **File Storage**: Integration with S3-compatible storage for problem assets
- **Real-time Notifications**: For submission results and system events.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: 
  - MongoDB (Primary database)
  - Redis (Caching and job queue)
  - Neon (Serverless Postgres for some features)
- **Storage**: AWS S3 (or compatible)
- **Containerization**: Docker
- **Job Queue**: BullMQ
- **Authentication**: JWT
- **Logging**: Winston with daily rotation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance
- Redis server
- AWS S3 or compatible storage
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Online_Judge/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   DB_URL=your_mongodb_connection_string
   POSTGRES_URL=your_postgres_connection_string
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   
   # JWT Authentication
   SECRET_KEY=your_jwt_secret_key
   
   # AWS S3/Cloudflare R2 Storage
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=your_aws_region
   S3_BUCKET_NAME=your_bucket_name
   
   # Cloudflare R2 (if using)
   R2_ACCOUNT_ID=your_r2_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret_key
   
   # Email Service
   MAIL_USER=your_email@example.com
   MAIL_PASS=your_email_password
   
   # Worker Configuration
   CODE_ROUTE=http://localhost:5000/api/code
   LOGS_WORKER_BASE=your_logs_worker_url
   LOGS_WORKER_TOKEN=your_logs_worker_token
   IMAGE_WORKER_BASE=your_image_worker_url
   IMAGE_WORKER_TOKEN=your_image_worker_token
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Code Execution
- `POST /api/code/run` - Execute code
- `POST /api/code/submit` - Submit code for evaluation

### Problems
- `GET /api/problems` - List all problems
- `POST /api/problems` - Create a new problem
- `GET /api/problems/:id` - Get problem details
- `PUT /api/problems/:id` - Update a problem
- `DELETE /api/problems/:id` - Delete a problem

### Submissions
- `GET /api/submissions` - List all submissions
- `GET /api/submissions/:id` - Get submission details
- `GET /api/users/:userId/submissions` - Get user's submissions

### Competitions
- `GET /api/competitions` - List all competitions
- `POST /api/competitions` - Create a new competition
- `GET /api/competitions/:id` - Get competition details
- `PUT /api/competitions/:id` - Update a competition

## Queue System

The backend uses BullMQ for managing code execution jobs. This ensures:
- Fair job processing
- Retry mechanisms for failed jobs
- Rate limiting
- Job prioritization

## Security

- Rate limiting (50 requests per minute per IP)
- CORS configuration
- Input validation
- Secure cookie handling
- JWT authentication

## Deployment

The application can be deployed using Docker:

```bash
docker build -t online-judge-backend .
docker run -p 5000:5000 online-judge-backend
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| REDIS_URL | Redis connection URL | Yes |
| JWT_SECRET | Secret for JWT signing | Yes |
| AWS_* | AWS credentials for S3 | Yes |
| NODE_ENV | Environment (development/production) | No |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the development team.

More questions solutions and blogs and ai resources to be added soon.

Other exciting features coming soon
