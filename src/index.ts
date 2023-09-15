import axios from "axios";
import express from "express"
import FormData from "form-data"
import cookieParser from "cookie-parser"
import puppeteer from "puppeteer";

const app = express();
app.use(express.json())
app.use(cookieParser())

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

    const pirn="01005034686"
    const baseUrl="https://programs.cu.edu.ge/cu"

app.get("/login",async (req,res) => {
  const browser = await puppeteer.launch({ headless:true, args: ['--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/loginStud`, { waitUntil: 'domcontentloaded' });
  await page.type("#pirn",pirn,{delay:100})
  await page.type("input[name='password']",pirn,{delay:100})
  await page.click("button[value='Login']",{delay:100})
  const cookies=await page.cookies()
  const {name,value}=cookies[0]
  await page.setCookie({name,value,secure:true,path:"/",expires:10 * 365 * 24 * 60 * 60})
  const ckies=await page.cookies()
  console.log({ckies})
  res.cookie(name,value)
  res.sendStatus(200)
  await browser.close();
  // res.send({data:loginStud.data,headers:loginStud.headers,imIn:JSON.stringify(loginStud.data).search("MY CU App")==-1})
});


app.get("/silabuss",async (req,res) => {
  const Cookie=`PHPSESSID=${req.cookies.PHPSESSID};httpOnly;secure;path='/'`
  const response = await axios.get("https://programs.cu.edu.ge/students/schedule.php",{headers:{
    Accept:"*/*",
    Cookie,
    "User-Agent": "PostmanRuntime/7.32.3",
  }
  })
  res.send(response.config)
})
app.get("/sylabuss",async (req,res) => {
  const browser = await puppeteer.launch({ headless:true, args: ['--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  // const cookie=req.cookies.PHPSESSID
  // await page.setCookie({name:'PHPSESSID',value:cookie,httpOnly:true,secure:true,domain:'programs.cu.edu.ge',path:"/"})

  // await page.goto(`${baseUrl}/loginStud`, { waitUntil: 'domcontentloaded' });
  // await page.type("#pirn",pirn,{delay:100})
  // await   page.type("input[name='password']",pirn,{delay:100})
  // await page.click("button[value='Login']",{delay:100})
  //
  // await page.waitForTimeout(100)

  await page.goto(`https://programs.cu.edu.ge/students/schedule.php`, { waitUntil: 'domcontentloaded' });
  try{
  const select="body > table > tbody > tr:nth-child(2) > td:nth-child(2) > form > table:nth-child(4) > tbody > tr:nth-child(3) > td > table > tbody"
  await page.waitForSelector(select)
  }catch(e){
    console.log("wait for selector failed")
  }
  const jsonArr=await page.evaluate(() => {
    const keys:string[]=[]
    const jsonTb:{[key:string]:string}[]=[]
    const select="body > table > tbody > tr:nth-child(2) > td:nth-child(2) > form > table:nth-child(4) > tbody > tr:nth-child(3) > td > table > tbody"
    const table=document.querySelector(select)
    if(!table)return
    const arr =table.children
    for(let idx=0;idx<arr.length;idx++){
      const tableRow=arr[idx].children
      let obj:{[key:string]:string}={}
      for(let tdIdx=0;tdIdx<tableRow.length;tdIdx++){
        const td=tableRow[tdIdx]
        if(idx==0){
          keys.push(td.innerHTML)
        }else{
          obj[keys[tdIdx]]=td.innerHTML as string
        }
      }
      if(idx!==0)jsonTb.push(obj)
    }
    return jsonTb
  })
  res.json(jsonArr)
  await browser.close();
});
