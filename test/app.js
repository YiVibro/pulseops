const express=require('express');
const {collectMetrics}=require('./collector');
const app=express();

app.get("/",async (req,res)=>{
   const data=await collectMetrics();
    res.status(200).send({
        server_data:data
    })
})
app.get("/api/health",(req,res)=>{
    res.status(200).send({message:"server is healthy"});
})
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});