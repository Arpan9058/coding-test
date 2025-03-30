const codingQuestions = {
    1: {
        id: 1,
        title: "Two Sum Problem",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers in nums such that they add up to target.",
        skeletonCode: {
            Java: String.raw`import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[2];
    }
}`,
            Python: String.raw`def twoSum(nums, target):
    # Your code here
    return []`,
            C: String.raw`#include <stdio.h>
#include <stdlib.h>
int* twoSum(int nums[], int numsSize, int target) {
    // Your code here
    return NULL;
}`,
            'C++': String.raw`#include <iostream>
#include <vector>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    return {};
}`
        },
        testCases: [
            { input: "[2,7,11,15], target = 9", expectedOutput: "[0,1]" },
            { input: "[3,2,4], target = 6", expectedOutput: "[1,2]" },
            { input: "[3,3], target = 6", expectedOutput: "[0,1]" }
        ]
    },
    2: {
        id: 2,
        title: "Subarray Product Less Than K",
        description: "Return the number of contiguous subarrays where the product of all the elements is strictly less than k.",
        skeletonCode: {
            Java: String.raw`import java.util.*;

public class Solution {
    public int numSubarrayProductLessThanK(int[] nums, int k) {
        // Your code here
        return 0;
    }
}`,
            Python: String.raw`def numSubarrayProductLessThanK(nums, k):
    # Your code here
    return 0`,
            C: String.raw`#include <stdio.h>
int numSubarrayProductLessThanK(int nums[], int n, int k) {
    // Your code here
    return 0;
}`,
            'C++': String.raw`#include <iostream>
#include <vector>
using namespace std;
int numSubarrayProductLessThanK(vector<int>& nums, int k) {
    // Your code here
    return 0;
}`
        },
        testCases: [
            { input: "[10, 5, 2, 6], k = 100", expectedOutput: "8" },
            { input: "[1, 2, 3], k = 0", expectedOutput: "0" }
        ]
    },
    3: {
        id: 3,
        title: "Add Two Numbers (Linked Lists)",
        description: "Add two numbers represented as linked lists in reverse order and return the sum as a linked list.",
        skeletonCode: {
            Java: String.raw`import java.util.*;

public class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // Your code here
        return null;
    }
}`,
            Python: String.raw`class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def addTwoNumbers(l1, l2):
    # Your code here
    return None`,
            C: String.raw`#include <stdio.h>
struct ListNode {
    int val;
    struct ListNode* next;
};

struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
    // Your code here
    return NULL;
}`,
            'C++': String.raw`#include <iostream>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(NULL) {}
};

ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
    // Your code here
    return nullptr;
}`
        },
        testCases: [
            { input: "[2, 4, 3], [5, 6, 4]", expectedOutput: "[7, 0, 8]" },
            { input: "[0], [0]", expectedOutput: "[0]" }
        ]
    }
};

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
app.use(express.static('public')); 
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
    req.session.language = language;
    req.session.score = 0;
    req.session.answers = {};
    req.session.questionsAsked = [];
    req.session.startTime = Date.now(); // Store the start time
    res.redirect('/question/1');
});

app.get('/question/:id', (req, res) => {
    if (!req.session.testStarted) {
        return res.redirect('/');
    }

    const questionId = parseInt(req.params.id);
    const language = req.session.language || 'Java'; 
    const question = codingQuestions[questionId];

    if (!question) {
        return res.status(404).send('Question not found.');
    }

    // Check if time limit has been exceeded
    const startTime = req.session.startTime;
    const now = Date.now();
    const timeElapsed = (now - startTime) / 1000; // Time elapsed in seconds
    const maxTimeAllowed = 45 * 60; // 45 minutes in seconds

    if (timeElapsed > maxTimeAllowed) {
        return res.redirect('/results');
    }

    req.session.currentQuestion = question;
    const skeletonCode = question.skeletonCode[language].trim();

    res.render('question', {
        question: question,
        language: language,
        skeletonCode: skeletonCode,
        testCases: question.testCases,
        questionNumber: questionId,
        timeRemaining: maxTimeAllowed - timeElapsed
    });
});

app.post('/submit-answer/:questionNumber', async (req, res) => {
    const questionNumber = parseInt(req.params.questionNumber);
    if (!req.session.testStarted || questionNumber < 1 || questionNumber > 3) {
        return res.redirect('/');
    }

    const { code } = req.body;
    const question = req.session.currentQuestion;
    if (!question) {
        return res.status(400).json({ error: 'Question not found in session.' });
    }

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
        req.session.answers[questionNumber] = { 
            code: code, 
            evaluation: evaluation,
            question: question,
            timeTaken: timeElapsed // Store the time taken for this question
        };

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
    const language = req.session.language;

    res.render('results', { score: finalScore, answers: answers, language: language }); 
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
    });
});

// --- Gemini Functions ---

async function evaluateCode(question, code, language) {
    if (!question || !question.testCases) {
        throw new Error('Test cases not found.');
    }

    const testCasesString = JSON.stringify(question.testCases);
    const prompt = `Evaluate the following ${language} code based on the given question and test cases.
    Question: ${question.description}
    Code:\n${code}\n
    Test Cases: ${testCasesString}
    
    Provide a detailed evaluation in the following JSON format:
    {
        "score": <number between 0-100>,
        "feedback": {
            "codeStructure": "<feedback about code structure and organization>",
            "implementation": "<feedback about the implementation approach>",
            "edgeCases": "<feedback about handling edge cases>",
            "suggestions": [
                "<suggestion 1>",
                "<suggestion 2>",
                ...
            ]
        }
    }

    If the code is an empty skeleton:
    - Set score to 0
    - Provide a structured approach to solve the problem
    - Include specific suggestions for implementation
    - Focus on key concepts and edge cases to consider

    Do not include actual code in the feedback, only descriptions and suggestions.`;

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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something broke!', details: err });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
