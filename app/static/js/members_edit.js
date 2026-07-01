// ======================================================
// MEMBERS EDIT
// Premium ERP
// ======================================================

const photo = document.getElementById("photo");
const preview = document.getElementById("preview");

const memberName = document.getElementById("member_name");
const previewName = document.getElementById("previewName");

const mobile = document.getElementById("mobile");
const previewMobile = document.getElementById("previewMobile");

const whatsapp = document.getElementById("whatsapp");
const previewWhatsapp = document.getElementById("previewWhatsapp");

const address = document.getElementById("address");
const previewAddress = document.getElementById("previewAddress");


// ===========================================
// PHOTO PREVIEW
// ===========================================

if(photo){

    photo.addEventListener("change", function(e){

        const file = e.target.files[0];

        if(!file) return;

        const reader = new FileReader();

        reader.onload = function(ev){

            preview.src = ev.target.result;

        };

        reader.readAsDataURL(file);

    });

}


// ===========================================
// MEMBER NAME
// ===========================================

if(memberName){

    memberName.addEventListener("keyup", function(){

        previewName.innerText =
            this.value || "Member Name";

    });

}



// ===========================================
// MOBILE
// ===========================================

if(mobile){

    mobile.addEventListener("keyup", function(){

        previewMobile.innerText =
            this.value || "----------";

    });

}



// ===========================================
// WHATSAPP
// ===========================================

if(whatsapp){

    whatsapp.addEventListener("keyup", function(){

        previewWhatsapp.innerText =
            this.value || "----------";

    });

}



// ===========================================
// ADDRESS
// ===========================================

if(address){

    address.addEventListener("keyup", function(){

        previewAddress.innerText =
            this.value || "Not Entered";

    });

}



// ===========================================
// NUMBERS ONLY
// ===========================================

function allowNumbers(input,max){

    input.addEventListener("input",function(){

        this.value =
            this.value
                .replace(/\D/g,"")
                .slice(0,max);

    });

}

if(mobile)
    allowNumbers(mobile,10);

if(whatsapp)
    allowNumbers(whatsapp,10);



// ===========================================
// FORM VALIDATION
// ===========================================

const form =
    document.getElementById("memberForm");

if(form){

form.addEventListener("submit",function(e){

    if(memberName.value.trim()==""){

        alert("Enter Member Name");

        memberName.focus();

        e.preventDefault();

        return;

    }

    if(mobile.value.length!=10){

        alert("Enter Valid Mobile Number");

        mobile.focus();

        e.preventDefault();

        return;

    }

});

}



// ===========================================
// RESET CONFIRMATION
// ===========================================

const resetButton =
document.querySelector("button[type='reset']");

if(resetButton){

resetButton.addEventListener("click",function(e){

    if(!confirm("Reset all changes?")){

        e.preventDefault();

    }

});

}



// ===========================================
// PAGE LOADED
// ===========================================

window.addEventListener("load",()=>{

    console.log("Members Edit Loaded");

});