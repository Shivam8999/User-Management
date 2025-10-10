const letters = 'ABCDEFGHIJKLM*NOPQRSTUVWXYZ@abcdefghijklmnopqrstuvwxzy#0123456789';

 exports.generateRandomPassword = (length) => {
    let password = '';
    for (let index = 0; index < length; index++) {
        password += letters.charAt(Math.floor(Math.random()*letters.length));
    }

    return password;
} 
