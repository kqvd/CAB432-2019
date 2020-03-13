function validation() {

    // Queries entered:
    var query = document.getElementById("myInput").value;


    // Regex for valid submissions (letters, numerics and # are allowed)
    const regex = /(#[a-zA-Z0-9]+,? *)*#[a-zA-Z0-9]+/;

    // Check if queries match
    if (query.match(regex)) {

        document.getElementById("error").style.display = "none";

        return true;

    } else {

        document.getElementById("error").style.display = "block";
    }

    return false;
    
}