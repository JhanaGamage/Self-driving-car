const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 400;

let gameOver = false;
const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const laneCount = 5;
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9, laneCount);

carsAiN = 1000;
let cars = [];
for (let index = 0; index < carsAiN; index++) {
    cars.push(new Car(road.getLaneCenter(2), 100, 30, 50, "AI"));
}

let bestCar = cars[0];
if(localStorage.getItem("bestBrain")){
    console.log(localStorage.getItem("bestBrain"))
    for(let i=0;i<cars.length;i++){

        cars[i].brain=JSON.parse(localStorage.getItem("bestBrain"));

        if(i!=0){
            NeuralNetwork.mutate(cars[i].brain, 0.3);
        }
    }
}

const traffic = [];
const pnjs = 70;
for (let i = 0; i < pnjs; i++) { // Generate all pnjs cars
    traffic.push(
        new Car(
            road.getLaneCenter(Math.floor(Math.random() * laneCount)), 
            Math.random() * -10000, // y pos
            30, // width
            50, // height
            "DUMMY"
        )
    );
}

function save(){
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
    window.location.reload();
}

function discard(){
    localStorage.removeItem("bestBrain");
    window.location.reload();
}

// fps function by markE
let fps, fpsInterval, startTime, now, then, elapsed;

function startAnimating(fps) {


    fpsInterval = 1000 / fps;
    then = window.performance.now();
    startTime = then;
    animate();
}

function animate(time) {
    if(gameOver) return;
    
    // request another frame
    requestAnimationFrame(animate);
    
    // calculate elapsed time since last loop
    now = window.performance.now();
    elapsed = now - then;
    
    // if enough time has elapsed, draw the next frame
    if (elapsed > fpsInterval) {

        // Get ready for next frame by setting then=now, but also adjust for your
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        then = now - (elapsed % fpsInterval);
        
        carCanvas.height = window.innerHeight;
        networkCanvas.height = window.innerHeight;

        traffic.forEach(trafficCar => {
            trafficCar.update(road.borders);
        });
    
        cars.forEach(car => {
            car.update(road.borders, traffic);
        });
        
        carsAlived = cars.filter(car => car.damaged === false);
        console.log(carsAlived.length)
        bestCar = carsAlived.find( c => c.y === Math.min( ...carsAlived.map(c=>c.y) ) ); // farest car
        //console.log(cars.find( c=> c.y === Math.max( ...cars.map(c=>c.y) ) ).y)
        
        carCtx.save();
        if(bestCar)
            carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);
        
        road.draw(carCtx);
        traffic.forEach(trafficCar => {
            trafficCar.draw(carCtx, "orange");
        });

        let allCarsDamaged = true;
        let livingCars = 0;
        cars.forEach(car => {
            if(!car.damaged){
                allCarsDamaged = false;
                livingCars++;
            }
            carCtx.globalAlpha = 0.5;

            car.draw(carCtx, "red");
        });
        //console.log("Ais = " + livingCars)
        
        if(allCarsDamaged){
            console.log("gameOver");
            gameOver = true;
            //save();
            //window.location.reload();
            return;
        }

        carCtx.globalAlpha = 1;
        if(bestCar)
            bestCar.draw(carCtx, "blue", true);
        
        carCtx.restore();
        
        networkCtx.lineDashOffset = -time/50; // Connections lines animation
        if(bestCar)
            Visualizer.drawNetwork(networkCtx, bestCar.brain);
    }
}

startAnimating(60);