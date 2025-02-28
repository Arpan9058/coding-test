const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like CSS)

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

// Gemini API Configuration
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro"});

// Routes
app.get('/', (req, res) => {
    res.render('index', { languages: ['Java', 'C', 'C++', 'Python'] }); // Pass languages
});

app.post('/start-test', (req, res) => {
    
    const language = req.body.language;
    if (!language || !['Java', 'C', 'C++', 'Python'].includes(language)) {
        return res.status(400).send('Invalid language selected.');
    }

    req.session.testStarted = true;
    req.session.language = language; // Store selected language
    req.session.score = 0;
    req.session.answers = {};
    req.session.questionsAsked = []; // Initialize questionsAsked
    res.redirect('/question/1');
});

app.get('/question/:questionNumber', async (req, res) => {
    const questionNumber = parseInt(req.params.questionNumber);
    if (!req.session.testStarted || questionNumber < 1 || questionNumber > 3) {
        return res.redirect('/');
    }

    try {
        const question = await generateQuestion(questionNumber, req.session.language, req.session.questionsAsked);
        req.session.question = question;
        req.session.questionsAsked.push(question.title);
        res.render('question', { question: question, questionNumber: questionNumber, language: req.session.language });

    } catch (error) {
        console.error('Error generating question:', error);
        res.status(500).render('error', { message: 'Error generating question.', details: error });
    }
});

app.post('/submit-answer/:questionNumber', async (req, res) => {
    const questionNumber = parseInt(req.params.questionNumber);
    if (!req.session.testStarted || questionNumber < 1 || questionNumber > 3) {
        return res.redirect('/');
    }

    const { code } = req.body;
    const question = req.session.question;
    const startTime = req.session.startTime;
    const now = Date.now();
    const timeElapsed = (now - startTime) / 1000; // Time elapsed in seconds
    const maxTimeAllowed = 45 * 60; // 45 minutes in seconds
  
    if (timeElapsed > maxTimeAllowed) {
      return res.status(400).json({ error: 'Time limit exceeded. Your submission was rejected.' });
    }
    try {
        const evaluation = await evaluateCode(question, code, req.session.language);
        req.session.score += evaluation.score;
        req.session.answers[questionNumber] = { code: code, evaluation: evaluation };

        const nextQuestion = questionNumber + 1;
        if (nextQuestion <= 3) {
            res.redirect(`/question/${nextQuestion}`);
        } else {
            res.redirect('/results');
        }

    } catch (error) {
        console.error('Error evaluating code:', error);
        res.status(500).render('error', { message: 'Error evaluating code.', details: error });
    }
});

app.get('/results', (req, res) => {
    if (!req.session.testStarted) {
        return res.redirect('/');
    }

    const finalScore = req.session.score;
    const answers = req.session.answers;
    const language = req.session.language; // Retrieve the language

    res.render('results', { score: finalScore, answers: answers, language: language }); // Pass language to results
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
    });
});

// --- Gemini Functions ---
async function generateQuestion(questionNumber, language, previousQuestions) {
    const prompt = `Generate a coding question suitable for a medium-level coding test in ${language}.
    Provide a detailed description and 3 test cases (input/expected output).
    The question should cover topics of dynamic programming and sliding window seperately Only include one approach in the question .
    The question must be different from the following questions: ${previousQuestions.join(", ")}.

    **Crucially, include a *minimal* skeleton code as a string, only defining the class and method signatures.  The method bodies should be empty.  For example, in Java, the format should be like this:**
    \`\`\`java
    public class Solution {
        public int maxSubArraySum(int[] nums, int k) {
            // Your code here
            return 0;
        }
    }
    \`\`\`
    **Note:** DO NOT include any logic, if statements, or calls to other functions within the skeleton code.  The "// Your code here" comment is just a placeholder.

    The skeleton code should be a *minimal* starting point for the user to write their solution.  Do not include any solution within the skeleton.
    Return the response in JSON format ONLY. Do not include any surrounding text or Markdown code fences.
    
    {
    "id": ${questionNumber},
    "title": "...",
    "description": "...",
    "testCases": [
    {"input": "...", "expectedOutput": "..."},
    {"input": "...", "expectedOutput": "..."},
    {"input": "...", "expectedOutput": "..."}
    ],
    "skeletonCode": "..." // The *minimal* skeleton code STRING goes here
    }`;
    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.candidates[0].content.parts[0].text;

        responseText = responseText.replace(/```json/g, '');
        responseText = responseText.replace(/```/g, '');
        responseText = responseText.trim();

        const question = JSON.parse(responseText);

        // Ensure skeletonCode is a string.  If it's an object, stringify it.
        if (typeof question.skeletonCode !== 'string') {
            question.skeletonCode = JSON.stringify(question.skeletonCode);
        }

        return question;
    } catch (error) {
        console.error("Gemini generateQuestion error:", error);
        throw error;
    }
}

async function evaluateCode(question, code, language) {
    const testCasesString = JSON.stringify(question.testCases);
    const prompt = `Evaluate the following ${language} code based on the given question and test cases.
    Question: ${question.description}
    Code:\n${code}\n
    Test Cases: ${testCasesString}
    Consider correctness, efficiency, style, and best practices for ${language}. Provide a score (0-100) and *detailed, constructive* feedback. The feedback should be structured and specific to the code, NOT a generic paragraph.

    **IMPORTANT:** Even if the code is incomplete or doesn't compile, provide feedback on what *could* be improved, potential approaches, or style issues.  If the code is completely empty, state that it is an empty skeleton and encourage the user to start implementing the solution.
    Do Not include code in the feedback
    Return a JSON object with keys "score" and "feedback" in JSON format ONLY. Do not include any surrounding text or Markdown code fences.
    The "feedback" value MUST be a non-empty string. If no specific feedback can be given, return a message like "The code is an empty skeleton. Please implement the solution."
     Ensure that feedback is provided according to the program and not in a paragraph format

    If it is a empty skeleton code with no implementation then return score 0 for that
    Provide the feedback in a structured way according to the program not a paragraph`;

    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.candidates[0].content.parts[0].text;

        responseText = responseText.replace(/```json/g, '');
        responseText = responseText.replace(/```/g, '');
        responseText = responseText.trim();

        const evaluation = JSON.parse(responseText);
        return evaluation;
    } catch (error) {
        console.error("Gemini evaluateCode error:", error);
        throw error;
    }
}

//Error handling Route
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something broke!', details: err });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});