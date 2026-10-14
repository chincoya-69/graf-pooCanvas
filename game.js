// ============================================
// PONG MULTIBALL - VERSION 2.0
// Proyecto POO + Canvas
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================
// CLASE BALL (PELOTA)
// ============================================

class Ball {
    constructor({ x, y, radius, speedX, speedY, color }) {
        this.startX = x;
        this.startY = y;

        this.x = x;
        this.y = y;
        this.radius = radius;

        this.speedX = speedX;
        this.speedY = speedY;

        this.color = color;
    }

    draw() {
        ctx.save();

        // Efecto luminoso
        ctx.shadowBlur = 14;
        ctx.shadowColor = this.color;

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.closePath();
        ctx.restore();
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote contra el borde superior
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
        }

        // Rebote contra el borde inferior
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.speedY = -Math.abs(this.speedY);
        }
    }

    reset() {
        // Regresar la pelota al centro
        this.x = canvas.width / 2;

        this.y = Math.max(
            this.radius,
            Math.min(
                canvas.height - this.radius,
                this.startY + (Math.random() - 0.5) * 90
            )
        );

        // Elegir una dirección horizontal aleatoria
        this.speedX =
            Math.abs(this.speedX) *
            (Math.random() < 0.5 ? -1 : 1);

        // Elegir una dirección vertical aleatoria
        this.speedY =
            Math.abs(this.speedY) *
            (Math.random() < 0.5 ? -1 : 1);
    }
}

// ============================================
// CLASE PADDLE (PALETA)
// ============================================

class Paddle {
    constructor(x, y, width, height, color, isPlayer = false) {
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

        this.color = color;
        this.isPlayer = isPlayer;

        this.speed = isPlayer ? 7 : 4.2;
    }

    draw() {
        ctx.save();

        // Efecto luminoso de la paleta
        ctx.shadowBlur = 18;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;

        ctx.beginPath();

        // Paleta con esquinas redondeadas
        ctx.roundRect(
            this.x,
            this.y,
            this.width,
            this.height,
            6
        );

        ctx.fill();
        ctx.restore();
    }

    move(direction) {
        this.y += direction * this.speed;

        // Limitar el movimiento al canvas
        this.y = Math.max(
            0,
            Math.min(
                canvas.height - this.height,
                this.y
            )
        );
    }

    // Movimiento automático de la computadora
    follow(targetY) {
        const desiredY = targetY - this.height / 2;
        const difference = desiredY - this.y;

        this.y +=
            Math.sign(difference) *
            Math.min(
                Math.abs(difference),
                this.speed
            );

        this.y = Math.max(
            0,
            Math.min(
                canvas.height - this.height,
                this.y
            )
        );
    }
}

// ============================================
// CLASE GAME (CONTROL DEL JUEGO)
// ============================================

class Game {
    constructor() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Crear las cinco pelotas
        this.balls = [
            new Ball({
                x: centerX,
                y: centerY - 150,
                radius: 7,
                speedX: 3.2,
                speedY: 2.1,
                color: '#38e8ff'
            }),

            new Ball({
                x: centerX,
                y: centerY - 75,
                radius: 11,
                speedX: 4.1,
                speedY: -2.8,
                color: '#ff568f'
            }),

            new Ball({
                x: centerX,
                y: centerY,
                radius: 15,
                speedX: 3.5,
                speedY: 3.2,
                color: '#b4ff5c'
            }),

            new Ball({
                x: centerX,
                y: centerY + 75,
                radius: 9,
                speedX: 5.0,
                speedY: -1.9,
                color: '#b69cff'
            }),

            new Ball({
                x: centerX,
                y: centerY + 150,
                radius: 13,
                speedX: 2.8,
                speedY: 4.0,
                color: '#ffbd59'
            })
        ];

        // Paleta del jugador: 200 px de altura
        // La versión original utilizaba 100 px.
        this.player = new Paddle(
            24,
            canvas.height / 2 - 100,
            14,
            200,
            '#38e8ff',
            true
        );

        // Paleta de la computadora
        this.cpu = new Paddle(
            canvas.width - 38,
            canvas.height / 2 - 50,
            14,
            100,
            '#ff568f'
        );

        // Registro de teclas presionadas
        this.keys = {};
    }

    // ========================================
    // DETECCIÓN DE COLISIÓN PELOTA-PALETA
    // ========================================

    circleHitsPaddle(ball, paddle) {
        // Encontrar el punto de la paleta
        // más cercano al centro de la pelota.

        const closestX = Math.max(
            paddle.x,
            Math.min(
                ball.x,
                paddle.x + paddle.width
            )
        );

        const closestY = Math.max(
            paddle.y,
            Math.min(
                ball.y,
                paddle.y + paddle.height
            )
        );

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;

        // Comparar la distancia con el radio
        // de la pelota.
        return (
            dx * dx + dy * dy <=
            ball.radius * ball.radius
        );
    }

    // ========================================
    // ACTUALIZAR EL ESTADO DEL JUEGO
    // ========================================

    update() {
        // Movimiento de la paleta del jugador
        if (this.keys.ArrowUp || this.keys.w || this.keys.W) {
            this.player.move(-1);
        }

        if (this.keys.ArrowDown || this.keys.s || this.keys.S) {
            this.player.move(1);
        }

        // Seleccionar una pelota para que la CPU
        // intente seguirla.
        const approaching = this.balls.filter(
            ball => ball.speedX > 0
        );

        const target = approaching.length
            ? approaching.reduce(
                (best, ball) =>
                    ball.x > best.x ? ball : best,
                approaching[0]
            )
            : this.balls.reduce(
                (best, ball) =>
                    Math.abs(ball.x - this.cpu.x) <
                    Math.abs(best.x - this.cpu.x)
                        ? ball
                        : best,
                this.balls[0]
            );

        this.cpu.follow(target.y);

        // Actualizar las cinco pelotas
        for (const ball of this.balls) {
            ball.move();

            // Colisión con la paleta del jugador
            if (
                ball.speedX < 0 &&
                this.circleHitsPaddle(ball, this.player)
            ) {
                // Evitar que la pelota quede atrapada
                // dentro de la paleta.
                ball.x =
                    this.player.x +
                    this.player.width +
                    ball.radius;

                // Cambiar la dirección horizontal
                ball.speedX =
                    Math.abs(ball.speedX) * 1.03;

                // Modificar la dirección vertical
                // según el punto donde golpea.
                ball.speedY +=
                    (
                        (
                            ball.y -
                            (
                                this.player.y +
                                this.player.height / 2
                            )
                        ) /
                        (this.player.height / 2)
                    ) * 0.8;

                // Limitar la velocidad vertical
                ball.speedY = Math.max(
                    -6,
                    Math.min(6, ball.speedY)
                );
            }

            // Colisión con la paleta de la CPU
            else if (
                ball.speedX > 0 &&
                this.circleHitsPaddle(ball, this.cpu)
            ) {
                ball.x =
                    this.cpu.x - ball.radius;

                // Cambiar la dirección horizontal
                ball.speedX = -Math.abs(ball.speedX);
            }

            // Si una pelota sale por un lateral,
            // reiniciarla en el centro.
            if (
                ball.x + ball.radius < 0 ||
                ball.x - ball.radius > canvas.width
            ) {
                ball.reset();
            }
        }
    }

    // ========================================
    // DIBUJAR TODOS LOS ELEMENTOS
    // ========================================

    draw() {
        // Limpiar la pantalla
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Línea central del campo
        ctx.save();

        ctx.strokeStyle = 'rgba(137, 164, 198, 0.24)';
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 12]);

        ctx.beginPath();

        ctx.moveTo(
            canvas.width / 2,
            12
        );

        ctx.lineTo(
            canvas.width / 2,
            canvas.height - 12
        );

        ctx.stroke();

        ctx.setLineDash([]);
        ctx.restore();

        // Dibujar todas las pelotas
        for (const ball of this.balls) {
            ball.draw();
        }

        // Dibujar las dos paletas
        this.player.draw();
        this.cpu.draw();
    }

    // ========================================
    // CAPTURAR LAS TECLAS
    // ========================================

    handleInput() {
        window.addEventListener('keydown', event => {
            if (
                [
                    'ArrowUp',
                    'ArrowDown',
                    ' '
                ].includes(event.key)
            ) {
                event.preventDefault();
            }

            this.keys[event.key] = true;
        });

        window.addEventListener('keyup', event => {
            this.keys[event.key] = false;
        });
    }

    // ========================================
    // INICIAR EL BUCLE DEL JUEGO
    // ========================================

    run() {
        this.handleInput();

        const gameLoop = () => {
            this.update();
            this.draw();

            requestAnimationFrame(gameLoop);
        };

        this.draw();
        gameLoop();
    }
}

// ============================================
// CREAR E INICIAR EL JUEGO
// ============================================

const game = new Game();
game.run();