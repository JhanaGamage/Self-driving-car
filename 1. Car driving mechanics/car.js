class Car{

    
    constructor(x,y,width,height, controlType){ // controlType can be : PLAYER/AI/DUMMY

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0, this.maxSpeed = 0;

        switch (controlType) {
            case "PLAYER":
            case "AI":
                this.acceleration = 0.3;
                this.maxSpeed = 15; 
                break;
            case "DUMMY":
                this.acceleration = 0.1;
                this.maxSpeed = 10;
        }

        this.friction = 0.041;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = controlType === "AI";
        if(controlType !== "DUMMY"){
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
        }

        this.controls = new Controls(controlType);
    }

    update(roadBorders, traffic){

        if(!this.damaged){
            this.move();
            this.polygon = this.createPolygon();

            if(this.sensor){ // Player or Ai

                this.damaged = this.assessDamage(roadBorders, traffic);
                this.sensor.update(roadBorders, traffic);
                const offsets = this.sensor.readings.map(s => s == null ? 0 : 1 - s.offset);
                const outputs = NeuralNetwork.feedForward(offsets, this.brain);

                if(this.useBrain){
                    this.controls.forward = outputs[0];
                    this.controls.left = outputs[1];
                    this.controls.right = outputs[2];
                    this.controls.reverse = outputs[3];
                }
            }

        }
    }
    
    assessDamage(roadBorders, traffic){ 
        
        for (let i = 0; i < roadBorders.length; i++) {
            if(polysIntersect(this.polygon, roadBorders[i])){ 
                return true;
            }
        }
        
        for (let i = 0; i < traffic.length; i++) {
            if(polysIntersect(this.polygon, traffic[i].polygon)){
                return true;
            }
        }

        return false;
    }

    createPolygon(){ // Get player box borders

        const points = [];
        const rad = Math.hypot(this.width, this.height)/2;
        const alpha = Math.atan2(this.width, this.height); // Tanegent -> Width / height
        // Now get corner points of the car
        points.push(
            {
                x: this.x - Math.sin(this.angle - alpha) * rad,
                y: this.y - Math.cos(this.angle - alpha) * rad
            },
            {
                x: this.x - Math.sin(this.angle + alpha) * rad,
                y: this.y - Math.cos(this.angle + alpha) * rad
            },
            {
                x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
                y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
            },
            {
                x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
                y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
            },
        );
        return points;
    }

    move(){

        if(this.controls.forward){
            this.speed += this.acceleration;
        }

        if(this.controls.reverse){
            this.speed -= this.acceleration;
        }

        if(this.speed > this.maxSpeed){
            this.speed = this.maxSpeed;
        }
        if(this.speed < -this.maxSpeed/2){
            this.speed =- this.maxSpeed/2;
        }

        if(this.speed >0 ){
            this.speed-=this.friction;
        }
        if(this.speed < 0){
            this.speed+=this.friction;
        }
        if(Math.abs(this.speed) < this.friction){
            this.speed = 0;
        }

        if(this.speed != 0){ // flip rotation from direction
            const flip = this.speed > 0 ? 1:-1;
            const rotationSpeed = 0.01;

            if(this.controls.left){
                this.angle += rotationSpeed*flip;
            }
            if(this.controls.right){
                this.angle -= rotationSpeed*flip;
            }
        }

        this.x -= Math.sin(this.angle)*this.speed;
        this.y -= Math.cos(this.angle)*this.speed;
    }

    draw(ctx, color, drawSensor=false){ // ctx = canva context
        if(this.y > 100) this.damaged = true;
        if(this.damaged) ctx.fillStyle = 'grey';
        else ctx.fillStyle = color;
        
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        // console.log(this)
        for (let i = 0; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();

        if(this.sensor && drawSensor)
            this.sensor.draw(ctx);
    }
}