exports.shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}


exports.generateOTP = () => {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}


exports.unixToDate = (unix) => {
    let unixMilliSeconds = unix * 1000;
    let dateObject = new Date(unixMilliSeconds)
    let humanDateFormat = dateObject.toLocaleDateString()
    return humanDateFormat;
}


exports.isUserExist = (userName, userEmail) => {
    User.find({ $or: [{ username: userName }, { email: userEmail }] }, (err, foundUsers) => {
        if (foundUsers.length != 0)
            return true;
        return false;
    }
    );
}


exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/user/login");
}


exports.findPlanName = (plan_id) => {
    var planName;
    if (plan_id == plans.StarterMonthly)
        planName = "Starter - Monthly"
    if (plan_id == plans.BasicMonthly)
        planName = "Basic - Monthly"
    if (plan_id == plans.PlusMonthly)
        planName = "Plus - Monthly"
    if (plan_id == plans.StarterQuarterly)
        planName = "Starter - Quarterly"
    if (plan_id == plans.BasicQuarterly)
        planName = "Basic - Quarterly"
    if (plan_id == plans.PlusQuarterly)
        planName = "Plus - Quarterly"
    if (plan_id == plans.StarterYearly)
        planName = "Starter - Yearly"
    if (plan_id == plans.BasicYearly)
        planName = "Basic - Yearly"
    if (plan_id == plans.PlusYearly)
        planName = "Plus - Yearly"
    return planName;
}


exports.isMonthlyPlan = (plan_id) => {
    if (plan_id == plans.StarterMonthly || plan_id == plans.BasicMonthly || plan_id == plans.PlusMonthly)
        return true;
    return false;
}


exports.isQuarterlyOrYearlyPlan = (plan_id) => {
    if (plan_id == plans.StarterQuarterly)
        return true;
    else if (plan_id == plans.BasicQuarterly)
        return true;
    else if (plan_id == plans.PlusQuarterly)
        return true;
    else if (plan_id == plans.StarterYearly)
        return true;
    else if (plan_id == plans.BasicYearly)
        return true;
    else if (plan_id == plans.PlusYearly)
        return true;
    return false;
}


exports.todaysDate = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    return today;
}