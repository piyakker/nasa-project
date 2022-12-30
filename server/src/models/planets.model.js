const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')

const planets = require('./planets.mongo')

function isHabitable(planet) {
  return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    const savePlanets = []
    fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
      .pipe(parse({
        comment: '#',
        columns: true
      }))
      .on('data', async (data) => {
        if (isHabitable(data)) {
          // 為什麼這邊不能用await,用了反而出錯，會導致stream讀完後，資料曾完成更新
          // 網友解法：將各個savePlanet推入一個陣列，再用await Promise.all確保都執行完，才檢查星球數量
          savePlanets.push(savePlanet(data));
        }
      })
      .on('error', (err) => {
        console.log(err)
        reject(err)
      })
      .on('end', async () => {
        await Promise.all(savePlanets)
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable planets found`)
        resolve()
      })
  })  
}

async function getAllPlanets() {
  return await planets.find({}, {
    '_id': 0, '__v': 0
  });
}

async function savePlanet(planet) {
  try {
    await planets.updateOne({
      keplerName: planet.kepler_name
    }, {
      keplerName: planet.kepler_name
    }, {
      upsert: true
    });
  } catch (err) {
    console.error(`Could not save planet ${err}`)    
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets
}