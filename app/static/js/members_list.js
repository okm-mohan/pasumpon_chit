// ====================================
// SEARCH FILTER
// ====================================

document.addEventListener("DOMContentLoaded", function(){

    const searchBox =
        document.getElementById("searchBox");

    if(!searchBox) return;

    searchBox.addEventListener("keyup", function(){

        const value =
            this.value.toLowerCase();

        const rows =
            document.querySelectorAll(
                "#memberTable tbody tr"
            );

        rows.forEach(row=>{

            const text =
                row.innerText.toLowerCase();

            if(text.includes(value)){

                row.style.display="";

            }else{

                row.style.display="none";

            }

        });

    });

});


// ====================================
// TABLE ANIMATION
// ====================================

document.addEventListener("DOMContentLoaded", function(){

    const rows =
        document.querySelectorAll(
            "#memberTable tbody tr"
        );

    rows.forEach((row,index)=>{

        row.style.opacity="0";

        setTimeout(()=>{

            row.style.transition=".4s";

            row.style.opacity="1";

        },index*60);

    });

});