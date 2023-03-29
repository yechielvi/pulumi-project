import express from 'express';
const app = express();

app.get('/health-check', (req, res) => {
    res.send()
})

app.listen(80)