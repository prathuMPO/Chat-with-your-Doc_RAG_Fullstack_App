/** @format */

//upload part of rag:

/*
Sofor Upload, 
1. we extract text from req.body, now this text is what user uploads or file from which he wants to be question or answered.

2. okay so once we have text, now we break them into chunk by breajing with white space, then we send each chunk to gemini as request to get embedding done, so we use chunkText() and getEmbedding(), and then when those chunks come back from getEmbedding those looks like numbers and then we store them into vectoreStore array,

and before all that we check for, is text given is empty or not 


so we basically cut them using "\n\n"

sorry yes we need original text and embedded chunk both as stored in vector store as obj

and then when old one is done with work we empty the store for next one

i guess we used for of loop with async awiat so it completes whole operation and returns us values wihtout breaking it



so for chunkText(){
const {text} = req.body

if(typeof text !== "string" || text === "" ){
  return res.statys(400).json({error: Please provide text})
}


}

*/

// Ask tis time:
/*
we extrcat question from req.body

we check question is empty  and also using trmi to remvoe white space and then also check typedof que is string

so beofre that we have to undersatnd what do wealredy have, beofre user askes qque he must have uplaoded doc or text so we then must hve chunked text and gotembedding of each chunk, stored in pair with text and embedding 

now when que arrives, we basically do is we also getembeding of question, and then using cosinesimilairy we compare we compare that que in vecorstore to find most releventChunk, then now in using mostreleveny chunk it basically, 


so first in cosinesimilarity, what hgappnes is if we hacve a and b as input, it basiclly takes it dot prodcut divides by mode of each and add them, so what this tell us is if near 1 or 1 it's most relevent, of 0 neutral, and -1 it's opposite

so when que embedding comes and we alredy have textEmbedding we send them i cosine and get ehe most relevnt chunks and then in most relevtn. we sort them in top 3 using sort method, then we have context, inside it only top chunk goes, as prompt which has que and top chunk only, and then user get's answer back


*/

/** @format */

require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json()); //middleware to read json because express cannot.
app.use(cors());
const PORT = 3000;

let vectorStore = [];

function chunkText(text) {
  return text
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk !== "");
}

async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  const result = await model.embedContent(text);
  const embeddedText = result.embedding.values;

  return embeddedText;
}

function cosineSimilrity(a, b) {
  let dot = 0;
  let sumA = 0;
  let sumB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    sumA += a[i] * a[i];
    sumB += b[i] * b[i];
  }

  return dot / (Math.sqrt(sumA) * Math.sqrt(sumB));
}

function findMostRelevent(questionEmbedding, topK = 3) {
  let scoreVector = vectorStore.map((item) => ({
    text: item.text,
    score: cosineSimilrity(questionEmbedding, item.embedding),
  }));

  scoreVector.sort((a, b) => b.score - a.score);

  return scoreVector.slice(0, topK);
}

app.post("/upload", async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Please provide some text" });
    }
    vectorStore = [];

    const chunks = chunkText(text);
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      vectorStore.push({ text: chunk, embedding: embedding });
    }

    const totalChunks = chunks.length;

    res.json({ message: "Document Stored", chunks: totalChunks });
  } catch (err) {
    res.status(500).json({ error: "Failed to get Embedding" });
  }
});

app.post("/ask", async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (topK !== undefined && (!Number.isInteger(topK) || topK <= 0)) {
      return res
        .status(400)
        .json({ error: "topK must be a whole number greater than 0" });
    }

    if (typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({ error: "Please provide Question:" });
    }

    if (vectorStore.length === 0) {
      return res.status(400).json({ error: "Upload a documnent first" });
    }

    const embeddingQuestion = await getEmbedding(question);
    const topChunks = findMostRelevent(embeddingQuestion, topK);

    const context = topChunks.map((item) => item.text).join("\n\n");

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `You are a helpful assistant. Answer the question using ONLY the context below.
If the answer is not in the context, say "I don't know based on the document."

Context:
${context}



Question: ${question}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log(responseText);
    res.json({ answer: responseText, sources: topChunks });
  } catch (err) {
    console.log("Error", err);
    res.status(500).json({ error: "Failed to answer the question" });
  }
});

app.listen(PORT, (err) => {
  if (err) {
    console.log("Server failed to start:", err.message);
    return;
  }
  console.log(`Server running on http://localhost:${PORT}`);
});
