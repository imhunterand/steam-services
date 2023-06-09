const SteamCommunity = require('steamcommunity');
const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp');
const Colors = require('colors');
const path = require('path');
var Async = require('async');
var fs = require('fs');
const ReadLine = require('readline');
var request = require('request')
const reader = require("readline-sync");

var community = new SteamCommunity; // Instance untuk komentar
var user1 = new SteamUser; // Instance untuk bot
var user = new SteamUser; // Instance untuk akun utama

var i=0; var j=0;

var text = fs.readFileSync('./bots.txt').toString('utf-8');
var bot = text.split('\n');
var bot1 = text.split('\n');
var text2 = fs.readFileSync('./comments.txt').toString('utf-8');
var comments = text2.split('\n')
config = require(path.resolve('config.json'));
let configRaw = fs.readFileSync('./config.json').toString();
const steamid = config.steamid;
const betweenComments = config.betweenComments;
const amount = config.amount;

console.log('%s adalah SteamID'.gray, steamid);

var coocs;
var success = 0; var failed = 0;

let rl = ReadLine.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Masukkan Username, password, dan steam guard code:
rl.question('Username: ', (accountName) => {
	rl.question('Password: ', (password) => {
		rl.question('GuardCode: ', (guard) => {
			doLogin(accountName, password, guard);
		});
	});
});

// Login ke akun utama:
function doLogin(accountName, password, authCode, captcha) {
	user.logOn({
		accountName: accountName,
		password: password,
		twoFactorCode: authCode,
		captcha: captcha
	})
}

// Callback saat berhasil login ke akun utama
user.on("loggedOn", function() {
	(async() => {
	   console.log('Akun utama: \n%s - berhasil masuk\n----------------------'.cyan, user.steamID);
	   await new Promise(r => setTimeout(r, 2000));
	   bot_login()
	})();
})

// Menambahkan teman dari akun utama
function add1(steamid) {
	user.addFriend(steamid, function(err, personaName) {
		if (err) { 
			if (err = 'DublicateName') {
				(async() => {
					console.log('[%s] Sudah ada dalam daftar teman'.green, steamid); 
					await new Promise(r => setTimeout(r, 5000));
				    add2(user.steamID); 
				})();
			}
			else console.log('Tidak dapat menambahkan teman %s, error: %s'.red, steamid, err); 
		}
		else { 
			(async() => {
				console.log('[%s] Permintaan terkirim'.green, steamid); 
				await new Promise(r => setTimeout(r, 5000));
			    add2(user.steamID); 

			})();
		}	 
	})
}

// Menerima permintaan pertemanan pada akun bot
function add2(steamid) {
	user1.addFriend(steamid, function(err, personaName) {
		if (err) {
			if (err = 'DublicateName') {
				(async() => {
					console.log('[%s] Sudah ada dalam daftar teman'.green, steamid); 
					await new Promise(r => setTimeout(r, 30000));
				    comm()
				})();
			}
			else console.log('Tidak dapat menambahkan teman %s, error: %s'.red, steamid, err); 
		}
		else { 
			(async() => {	
				console.log('[%s] Diterima'.green, user1.steamID); 
				await new Promise(r => setTimeout(r, 30000));
				comm() 
			})();
		}
	})
}

// Ketika berhasil login pada akun bot, tambahkan ini dari akun utama (fungsi add1)
user1.on("loggedOn", function() {
   console.log('Bot № %s: \n[%s] Berhasil masuk'.cyan, i+1, user1.steamID);
   add1(user1.steamID)
})

// Ketika akun bot keluar, lanjut ke akun bot berikutnya
user1.on("disconnected", function() {
	(async() => {	
	   console.log('[%s] Berhasil keluar\n--------------'.gray, user1.steamID);
	   await new Promise(r => setTimeout(r, 5000));
	   bot_login()
	})();
})

// Login ke akun bot menggunakan node-user
function bot_login() {
	(async() => {
		if (i < bot.length) {
			user1.logOn({
				"accountName": bot[i].split(":")[0],
				"password": bot[i].split(":")[1],
				"twoFactorCode": SteamTotp.generateAuthCode(bot[i].split(":")[2]),
			});		
		}
		else { console.log('Proses selesai'); }
	})();
}

// Berkomentar menggunakan steam-community, lalu hapus dari daftar teman, lalu logout
function comm() {
	(async() => {
		comm1();
		function comm1() {
			community.login({
				"accountName": bot[j].split(":")[0],
				"password": bot[j].split(":")[1],
				"twoFactorCode": SteamTotp.generateAuthCode(bot[j].split(":")[2]),
			},
			function (err, sessionID, cookies, steamguard, oAuthToken) {
				if (err) { 
					if (err.message == 'SteamGuardMobile') { comm1() }
					else console.log('[%s] Tidak dapat mengautentikasi (Error: %s)'.red, community.steamID, err);
				 }
				if (!err) {	
					var comment = comments[Math.floor(Math.random() * comments.length)];
					community.postUserComment(user.steamID, comment, (error) => {
			            if (error) { console.log("error saat mengirim komentar: %s",error); }
			            if (!error) { console.log('[%s] Berhasil berkomentar. Komentar: %s'.green, community.steamID, comment);  }
			        });
				};
			});
		};
		await new Promise(r => setTimeout(r, 2000));
		user.removeFriend(user1.steamID);
		i++; j++;
		await new Promise(r => setTimeout(r, 2000));
		user1.logOff() 
	})();
}
