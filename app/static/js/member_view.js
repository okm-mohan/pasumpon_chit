document.addEventListener(
    "DOMContentLoaded",
    function(){

        const cards =
            document.querySelectorAll(".card");

        cards.forEach((card,index)=>{

            card.style.opacity="0";

            setTimeout(()=>{

                card.style.transition=".5s";

                card.style.opacity="1";

            },index*150);

        });

    }
);