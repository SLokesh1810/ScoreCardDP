
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader-wrapper");
    
    // Trigger fade-out
    loader.style.opacity = "0";
    
    // Wait for the transition to complete before hiding
    setTimeout(() => {
        loader.style.visibility = "hidden";
    }, 500); // Match with your transition duration
});


document.getElementById("loginSubmit").addEventListener("click", function (event) {
    event.preventDefault();

    let name = document.getElementById("UserID");
    let pass = document.getElementById("Password");
    let uname = document.getElementById("uid");
    let pword = document.getElementById("pword");

    uname.textContent = "";
    pword.textContent = "";
    name.style.backgroundColor = "";
    pass.style.backgroundColor = "";

    let isValid = true;

    if (name.value.includes(" ") || name.value.includes("-")) {
        name.style.backgroundColor = "rgba(255, 0, 0, 0.585)";
        uname.textContent = "*Invalid username! It should not contain '-' or spaces.";
        return;
    }

    if (pass.value.length < 8) {
        pass.style.backgroundColor = "rgba(255, 0, 0, 0.585)";
        pword.textContent = "*Password must be at least 8 characters long.";
        return;
    }

    if (isValid) {
        document.getElementById("loginForm").submit();
    }
});