function rand(min, max){return Math.floor(Math.random() * (max - min + 1)) + min;}
function isIE78(){if (!$.support.leadingWhitespace) return true; return false;}
var notIE = !isIE78();

var playersNames = [ 'Токен', 'Айк', 'Кайл', 'Картман', 'Баттерс', 'Стэн' ];

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
		var p = 5; // Индекс в PlayersNames
		for (var left = 0, right = d; n; --n) {
			if (r) {
				++right;
				--r;
			}
			players.push(new Player(cards.slice(left, right), playersNames[p], placeholders.shift()));
			left = right;
			right += d;
			--p;
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
	this.getCard = function(blind) { // Взять карту у игрока (шапкой_вверх)
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
		playerCounter.innerHTML = cards.length;
		playerText.innerHTML = '+' + c.length;
		var f = function(){
			$(playerText).animate({ opacity: 1 }, 400);
		}
		animation.addFunction(f);
	}
	this.makeLooser = function() { // Сделать игрока проигравшим
		if (this.isUser) {
			$('#loose-box').css('visibility', 'visible');
		}
		$(playerImage).animate({ opacity: 0 }, 2000);
		$(playerName).animate({ opacity: 0 }, 2000);
	}
	this.makeWinner = function() { // Сделать игрока победителем
		if (this.isUser) {
			$('#win-box').css('visibility', 'visible');
		}
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
	playerName = $.trim(playerName);
	if (playerName) {
		playersNames[5] = playerName;
		$('#player-avatar').attr('src', 'img/avatars/user.png?rnd=' + rand(1, 100000));
		$('#player-image').css('background', '#37414B');
	} else {
		playersNames[5] = 'Стэн';
		$('#player-avatar').attr('src', 'img/avatars/3.png?rnd=' + rand(1, 100000));
		$('#player-image').css('background', '#FFFABB');
	}
	/* */
	$('.player-placeholder').css('visibility', 'hidden');
	$('.player-placeholder').css('opacity', 1);
	$('.player-text').css('opacity', 0);
	$('.player-name').css('opacity', 1);
	$('.player-image').css('opacity', 1);
	$('.card-img').remove();
	$('#podskazka').css('visibility', 'visible');
	/* */
	var table = []; // Все карты на столе
	var deck = new Deck();
	var players = deck.deal(n);
	if (playerName) {
		players[0].isUser = true;
	}
	var war = false;
	var result = false;
	var winner = false;
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
		$('#podskazka').css('visibility', 'hidden');
		animation.makeAnimation();
		if (winner) {
			$('.text-box-wrap').css('visibility', 'hidden');
			$('#new-game-box').css('visibility', 'visible');
			$('#name').focus();
			return false;
		}
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
	$('.text-box').click(function(e){
		e.stopPropagation();
	});
	var nextR = function(e){
		if (game) {
			$('.text-box-wrap').css('visibility', 'hidden');
			if (!$('#next-move').hasClass('active')) {
				game.nextRound();
			}
		} else {
			$('.text-box-wrap').css('visibility', 'hidden');
			$('#new-game-box').css('visibility', 'visible');
			$('#name').focus();
		}
	};
	$('.content').click(nextR);
	$('#next-move').click(nextR);
	$('#new-game').click(function(){
		$('.text-box-wrap').css('visibility', 'hidden');
		$('#new-game-box').css('visibility', 'visible');
		$('#name').focus();
	});
	$('#rules').click(function(){
		$('.text-box-wrap').css('visibility', 'hidden');
		$('#rules-box').css('visibility', 'visible');
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
		return false;
	});
	$('.close').click(function(){
		$(this).parent().parent().css('visibility', 'hidden');
	})
	/* */
	$('#name').focus();
});