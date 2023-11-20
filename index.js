const express = require('express');
const fs = require('fs').promises; 

const app = express();
const port = 3000;

// Function to generate a question paper
async function generateQuestionPaper(totalMarks, distributions) {
  try {
    const questionStore = JSON.parse(await fs.readFile('question_store.json', 'utf8'));

    const questionPaper = [];
    let remainingMarks = totalMarks;

    distributions.forEach(({ attribute, percentages }) => {

      const filteredQuestions = questionStore.filter(question => {
        return question[attribute];
      });

      percentages.forEach(({ value, percentage }) => {
        const marksForValue = Math.ceil(totalMarks * (percentage / 100));

        const filteredQuestionsForValue = filteredQuestions.filter(question => question[attribute] === value);

        if (filteredQuestionsForValue.length > 0) {
          let curr_sum = 0;
          filteredQuestionsForValue.forEach((q) => {
            if (curr_sum + q.marks <= marksForValue) {
              questionPaper.push(q);
              curr_sum += q.marks;
            }
          })
          remainingMarks -= curr_sum;
        }
      });
    });

    // If there are remaining marks, add more questions randomly
    while (remainingMarks > 0) {
      const randomQuestion = questionStore[Math.floor(Math.random() * questionStore.length)];
      questionPaper.push(randomQuestion);
      remainingMarks -= randomQuestion.marks;
    }

    return questionPaper;
  } catch (error) {
    throw new Error(`Error reading or parsing the file: ${error.message}`);
  }
}

// Route to generate question paper
app.get('/generateQuestionPaper', async (req, res) => {
  const totalMarks = parseInt(req.query.totalMarks) || 50;
  const distributions = req.query.distributions ? JSON.parse(req.query.distributions) : [];

  try {
    const generatedQuestionPaper = await generateQuestionPaper(totalMarks, distributions);
    res.json({ generatedQuestionPaper });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
