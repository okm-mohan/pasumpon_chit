// Hero Slider Background Images

const hero = document.querySelector(".hero");

const images = [
    "images/hero.jpg",
    "images/hero2.jpg",
    "images/hero3.jpg"
];

let current = 0;

function changeSlide() {
    current++;

    if(current >= images.length){
        current = 0;
    }

    hero.style.background =
        `url('${images[current]}') center center/cover`;
}

setInterval(changeSlide, 5000);

// Smooth Fade Animation

document.addEventListener("DOMContentLoaded", () => {

    const cards =
        document.querySelectorAll(
            ".card,.feedback-card,.login-card"
        );

    cards.forEach((card,index)=>{

        card.style.opacity="0";
        card.style.transform="translateY(40px)";

        setTimeout(()=>{

            card.style.transition="0.6s";
            card.style.opacity="1";
            card.style.transform="translateY(0)";

        }, index*150);

    });

});