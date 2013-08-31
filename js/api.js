function rand(min, max){return Math.floor(Math.random() * (max - min + 1)) + min;}
function isIE78(){if (!$.support.leadingWhitespace) return true; return false;}
var notIE = !isIE78();

playersNames = [ 'Токен', 'Айк', 'Кайл','Картман', 'Баттерс', 'Стэн' ];

/*  Колода  */
var Deck = function() {
	var cards = [];
	var placeholders = $('.player-placeholder').toArray();
	/* */
	var tmp = placeholders[0];
	placeholders[0] = placeholders[2];
	placeholders[2] = tmp;
	var tmp = placeholders[1];
	placeholders[1] = placeholders[3];
	placeholders[3] = tmp;
	/* */
	for (var i = 0; i < 4; ++i) { // Заполнение колоды
		for (var j = 0; j < 13; ++j) {
			cards.push({
				suit: i,
				value: j
			});
		}
	}
	/* */
	var shuffle = function() { // Перемешать карты
		for (var i = 51; i > 0; --i) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = cards[i];
			cards[i] = cards[j];
			cards[j] = t;
		}
	}
	/* */
	this.deal = function(n) { // Раздать карты - создать список из n игроков
		shuffle();
		var d = Math.floor(52 / n);
		var r = 52 % n;
		var players = [];
		for (var left = 0, right = d; n; --n) {
			if (r) {
				++right;
				--r;
			}
			players.push(new Player(cards.slice(left, right), playersNames.pop(), placeholders.shift()));
			left = right;
			right += d;
		}
		return players;
	}
}

/*  Игрок  */
var Player = function(cards, name, placeholder) {
	$(placeholder).css('visibility', 'visible');
	var playerText = $(placeholder).find('.player-text')[0];
	var playerImage = $(placeholder).find('.player-image')[0];
	var playerCounter = $(placeholder).find('.player-counter')[0];
	playerCounter.innerHTML = cards.length;
	var playerName = $(placeholder).find('.player-name')[0];
	playerName.innerHTML = name;
	/* */
	this.getCard = function(blind) { // Взять карту у игрока (шапкой вверх)
		var card = cards.pop();
		if (card) {
			if (blind) {
				var image = $('<img />').attr({ 'class': 'card-img', src: 'img/back.png' }).insertBefore(playerText);
				image.css('opacity', '0');
			} else {
				var image = $('<img />').attr({ 'class': 'card-img', src: 'img/' + card.suit + '/' + card.value + '.png' }).insertBefore(playerText)
			}
			if (notIE) {
				image.rotate(rand(-20, 20));
			} else {
				image.css('border', '1px solid black');
			}
			card.image = image;
			--playerCounter.innerHTML;
		}
		return card;
	}
	this.giveCards = function(c) { // Дать игроку список карт
		cards = c.concat(cards);
		var f = function(){
			playerCounter.innerHTML = cards.length;
			playerText.innerHTML = '+' + c.length;
			$(playerText).animate({ opacity: 1 }, 400);
		}
		animation.addFunction(f);
	}
	this.makeLooser = function() { // Сделать игрока проигравшим
		//console.log( name + ' is looser...' );
		$(playerImage).animate({ opacity: 0 }, 2000);
		$(playerName).animate({ opacity: 0 }, 2000);
	}
	this.makeWinner = function() { // Сделать игрока победителем
		//console.log('AND THE WINNER IS ' + name);
	}
	this.amountOfCards = function() { // Количество карт у игрока
		return cards.length;
	}
	this.getName = function() { // Имя игрока
		return name;
	}
}

/* Анимация */
var Animation = function() {
	var events = [];
	var but = document.getElementById('next-move');
	/* */
	var animation = function() {
		var e = events.shift();
		if (e) {
			switch(e.eventType) {
				case 'pause':
					setTimeout(animation, e.delay);
					break;
				case 'func':
					e.func();
					animation();
					break;
				case 'appear':
					e.image.animate({opacity: 1}, 100, animation);
					break;
				case 'disappear':
					e.images[0].animate({ opacity: 0 }, 1000, animation);
					for (var i = 1; i < e.images.length; ++i) {
						e.images[i].animate({ opacity: 0 }, 1000);
					}
					break;
			}
		} else {
			$(but).removeClass('active');
			$(but).blur();
		}
	}
	/* */
	this.makeAnimation = function() { // Начать анимацию
		$(but).addClass('active');
		animation();
	}
	this.addPause = function(delay) {
		events.push({
			eventType: 'pause',
			delay: delay
		})
	}
	this.addFunction = function(func) {
		events.push({
			eventType: 'func',
			func: func
		})
	}
	this.imageAppear = function(image) {
		events.push({
			eventType: 'appear',
			image: image
		})
	}
	this.imagesDisappear = function(images) {
		events.push({
			eventType: 'disappear',
			images: images
		})
	}
}

/*  Игра  */
var Game = function(n, playerName) {
	/* */
	var table = []; // Все карты на столе
	var deck = new Deck();
	/* */
	playerName = $.trim(playerName);
	if (playerName) {
		playersNames = [ 'Токен', 'Айк', 'Кайл','Картман', 'Баттерс', playerName ];
		$('.player-placeholder').find('img')[3].src = 'img/avatars/user.png'
	} else {
		playersNames = [ 'Токен', 'Айк', 'Кайл','Картман', 'Баттерс', 'Стэн' ];
		$('.player-placeholder').find('img')[3].src = 'img/avatars/3.png'
	}
	$('.player-placeholder').css('visibility', 'hidden');
	$('.player-placeholder').css('opacity', 1);
	$('.player-text').css('opacity', 0);
	$('.player-name').css('opacity', 1);
	$('.player-image').css('opacity', 1);
	/* */
	var players = deck.deal(n);
	var war = false;
	var result = false;
	/* */
	var giveAndCompareCards = function() { // Положить карты на стол и сравнить их
		var max = -1; // Определение максимума
		var maxPositions = [];
		var card;
		for (var i in players) {
			card = players[i].getCard(false);
			animation.imageAppear(card.image);
			table.push(card);
			if (card.value > max) {
				max = card.value;
				maxPositions = [i];
			} else if (card.value == max) {
				maxPositions.push(i);
			}
		}
		if (maxPositions.length == 1) { // Есть победитель
			animation.addPause(1000);
			var w = maxPositions[0];
			players[w].giveCards(table);
			var images = [];
			for (var t in table) {
				images.push(table[t].image);
			}
			animation.imagesDisappear(images);
			table = [];
			for (var i in players) {
				if (players[i].amountOfCards() == 0) {
					players[i].makeLooser();
					delete players[i];
				}
			}
			if (players[w].amountOfCards() == 52) {
				winner = true;
				players[w].makeWinner();
			}
			result = false;
		} else { // Нет победителя
			result = true;
		}
		animation.makeAnimation();
		return result;
	}
	/* */
	this.nextRound = function() { // Провести один раунд
		animation.makeAnimation();
		if (war) { // Идет "война"
			for (var i in players) {
				card = players[i].getCard(true);
				if (card == undefined) {
					players[i].makeLooser();
					delete players[i];
					continue;
				}
				table.push(card);
				animation.imageAppear(card.image);
				if (players[i].amountOfCards() == 0) {
					players[i].makeLooser();
					delete players[i];
				}
			}
			war = giveAndCompareCards();
			return;
		} else {
			$('.card-img').remove();
			$('.player-text').animate({'opacity': '0'}, 0);
			war = giveAndCompareCards();
			return;
		}
		
	}
}

/* */
$(document).ready(function(){
	var game = undefined;
	$('#next-move').click(function() {
		if (game) {
			$('#new-game-box').css('visibility', 'hidden');
			$('#rules-box').css('visibility', 'hidden');
			if (!$(this).hasClass('active')) {
				game.nextRound();
			}
		} else {
			$('#new-game-box').css('visibility', 'visible');
			$('#rules-box').css('visibility', 'hidden');
		}
	});
	$('#new-game').click(function(){
		$('#new-game-box').css('visibility', 'visible');
		$('#rules-box').css('visibility', 'hidden');
	});
	$('#rules').click(function(){
		$('#new-game-box').css('visibility', 'hidden');
		$('#rules-box').css('visibility', 'visible');
	});
	$('#rules-box-close').click(function(){
		$('#rules-box').css('visibility', 'hidden');
	});
	$('#new-game-box-close').click(function(){
		$('#new-game-box').css('visibility', 'hidden');
	});
	var players;
	var radios = $('input[type=radio]');
	$('#new-game-start').click(function(){
		$('#new-game-box').css('visibility', 'hidden');
		animation = new Animation();
		for (var i in radios)
			if (radios[i].checked)
				players = radios[i].value;
		game = new Game(players, $('#name').val());
	});
});