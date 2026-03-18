class Card {
    static all = [];
    static deck = [];
    static drawn = [];
    static buildDeck() {
        this.deck = 
            this.suits.map(suit =>
            this.values.map(value => 
                new Card(value,suit)
            )).flat();
    }
    static dealNewGame() {
        this.buildDeck();
        this.shuffle();

        this.deck.forEach(card => {
            card.slotOffset = {x:0,y:0};
            card.turnFaceDown();
            card.placeOn(slots.deck);
        });
        
        for(let j = 1; j <= 7; j++) {
        for(let i = j; i <= 7; i++) {
            var card = this.deck.pop();
            card.slotOffset = {x:0,y:20};
            card.placeOn(slots.columns[i-1]);
            card.moveToTop();
            if (i==j) card.turnFaceUp();
        }}
        
        
    }
    static shuffle() {
        (deck => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }})(this.deck)
    }

    static draw3() {
        
        var loc = slots.drawn
        var card; 
        for (let xo = 0; xo <=40; xo+=20) {
        if (this.deck.length == 0) return;
        card = this.deck.pop();
        card.slotOffset = {x:20,y:0};
        this.drawn.push(card);
        card.placeOn(slots.drawn);
        card.goto(loc.x+xo,loc.y);
        card.turnFaceUp();
        card.moveToTop();
        }
        
    }

    static available = {
        fromDeck() {
            return [
                ...Card.drawn.filter(
                    (_,i) => i % 3 == 2
                ),
                ...Card.deck.toReversed().filter(
                    (_,i) => i % 3 == 2 ||
                        i == Card.deck.length - 1
                )]
        },
        fromColumns() {
            return slots.columns.map(slot => {
                var card = slot.bottom();
                while (card.parent !== slot && card.parent?.isFaceUp) card = card.parent;
                return card;
            });
        },
        fromAces() {
            return slots.aces.map(slot => slot.bottom());
        }
    }

    static possible() {
        var fromDeck = this.available.fromDeck(),
            fromColumns = this.available.fromColumns(),
            fromAces = this.available.fromAces(),
            column = fromColumns.find(c => slots.columns.includes(c)),
            ace = fromAces.find(c => slots.aces.includes(c));
            fromColumns = fromColumns.filter(c => c == column || !slots.columns.includes(c));
            fromAces = fromAces.filter(c => c == ace || !slots.aces.includes(c));
        var avail = [];
            
        [...fromColumns,...fromAces].forEach(target => {
            [...fromDeck,...fromColumns].forEach(card => {
                if (target === card) return;
                if (card.isValidParent(target,true)) avail.push({
                    from: card.element, to: target.element})
            })
        })

        return avail;
    }

    static flipDeck() {
        
        var loc = slots.deck,
            card; 
        while (this.drawn.length) {
            card = this.drawn.pop();
            card.slotOffset = {x:0,y:0};
            this.deck.push(card);
            card.placeOn(slots.deck);
            card.turnFaceDown();
            card.moveToTop();
        }
        
    }
    static updZIndex() {
        this.all.forEach((card,i) => card.element.style.zIndex = i);
    }
    static suits = ['spades','hearts','diamonds','clubs']
    static values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
    static getSrc(value,suit) {
        return value == 'blank' ? 'svgs/blank.svg'
            :  value == 'back' ? 'svgs/back(black).svg'
            : `svgs/${suit}/${value}.svg`;
    }
    getSrc() {return Card.getSrc(this.value,this.suit);}
    moveToTop() {
        Card.all = [...Card.all.filter(card => !this.allChildren().includes(card)), ...this.allChildren()];
        Card.updZIndex();
    }
    get color() {
        if (this.suit == 'hearts' || this.suit == 'diamonds') return 'red';
        if (this.suit == 'spades' || this.suit == 'clubs') return 'black';
    }
    get nvalue() {
        return ({
            A:1,
            '2':2, 
            '3':3, 
            '4':4, 
            '5':5, 
            '6':6,
            '7':7,
            '8':8,
            '9':9,
            '10':10,
            J:11,
            Q:12,
            K:13
        })[this.value]

    }
    isValidMove(card) {
       
            slots.columns.includes(card) 
            && this.value == 'K' 
            ||
            slots.columns.includes(card?.top()) 
            && this.nvalue == card.nvalue + 1
            && this.color != card.color
            ||
            slots.aces.includes(card)
            && this.value == 'A'
            ||
            slots.aces.includes(card?.top())
            && this.nvalue == card.nvalue - 1
            && this.suit == card.suit
    }
    isValidParent(card,ignoreKids=false) {
        if (!card) return false;
        var inBot7 = slots.columns.includes(card?.top()),
            atBot7 = slots.columns.includes(card),
            inTop7 = slots.aces.includes(card?.top()),
            atTop7 = slots.aces.includes(card),
            faceup = card.isFaceUp,
            nokids = card.child === null,
            oppcol = this.color != card.color,
            eqsuit = this.suit === card.suit,
            nplus1 = card.nvalue == this.nvalue + 1,
            nsubt1 = this.nvalue == card.nvalue + 1,
            amking = this.value == 'K',
            am_ace = this.value == 'A';
            
        return (inBot7 && nokids && faceup && oppcol && nplus1)
            || (atBot7 && amking)
            || (inTop7 && nokids && faceup && eqsuit && nsubt1 && (this.child == null || ignoreKids))
            || (atTop7 && am_ace && (this.child == null || ignoreKids))
    }
    get isFaceDown() {return !this.isFaceUp}
    set isFaceDown(b) {this.isFaceUp = !b}
    constructor(value,suit,x,y) {
        var img = this.element = document.createElement('img');
        document.body.append(this.element);
        img.src = Card.getSrc(value,suit);
        img.className = 'card';
        img.setAttribute('draggable','false');
        img.style.position = 'absolute';
        img.self = this;
        this.draggable = true;
        this.isFaceUp = true;
        this.slotOffset = (value == 'blank') ? {x:0,y:0} : {x:0, y:20};
        if (arguments.length >2) this.goto(x,y);
        img.onclick = function(event) {
            var self = this.self;
            if (!self.isFaceUp 
                && !self.child 
                && slots.columns.includes(self.top()) 
                && self !== self.top()
            ) {
                self.turnFaceUp();
            }
            if (self === slots.deck) {
                Card.flipDeck()
            } else if (self.top() === slots.deck) {
                Card.draw3();
            }
        }
        img.onpointerdown = function(event) {
            var self = this.self;
            if (self.top() == slots.drawn && self !== self.bottom()) return; 
            if (!self.draggable) return;
            if (!self.isFaceUp) return;
            self.moveToTop();
            this.setPointerCapture(event.pointerId);
            this.onpointermove = function(event) {
                self.x += event.movementX;
                self.y += event.movementY;
            }
            this.onpointerup = function(event) {
                this.releasePointerCapture(event.pointerId);
                this.onpointermove = null;
                this.onpointerup = null;
                var hoveringOver = Card.all.find(card => card !== self && card.inDropZone(self.x,self.y));
                if (!self.isValidParent(hoveringOver)) {
                    self.goto(self.parent.slot);
                    return;
                }
                if (self.parent) {
                    if (hoveringOver !== this.self.parent) {
                        self.parent.child = null;
                        self.parent = null;
                    }
                }
                if (hoveringOver) {
                    self.parent = hoveringOver;
                    if (slots.aces.includes(hoveringOver.top())) self.slotOffset = {x:0,y:0};
                    hoveringOver.child = self;
                    self.x = hoveringOver.slot.x;
                    self.y = hoveringOver.slot.y;
                }
                if (![slots.drawn,slots.deck].includes(self.top())) {
                    if (Card.deck.includes(self)) Card.deck.splice(Card.deck.indexOf(self),1);
                    if (Card.drawn.includes(self)) Card.drawn.splice(Card.drawn.indexOf(self),1);
                } 
            }
        }
        this.child = null;
        this.parent = null;
        this.value = value;
        this.suit = suit;
        Card.all.push(this);
    }

    get slot() {

        if (slots.columns.includes(this)) return ({x:this.x, y:this.y});
        if (slots.columns.includes(this.top())) return ({x:this.x, y:this.y + 20});
        if (slots.aces.includes(this.top())) return ({x:this.x, y:this.y});
        if (this.top() === slots.deck) return ({x:this.x, y:this.y});

        return {x:this.x + this.slotOffset.x, y:this.y + this.slotOffset.y}
    }

    

    placeOn(card) {
        card = card.bottom();
        if (this.parent) this.parent.child = null;
        this.parent = card;
        card.child = this;
        this.goto(card.slot);
    }
    nextOpenSlot() {
        return this.bottom().slot;
    }

    turnFaceUp() {
        this.isFaceUp = true;
        this.element.src = this.getSrc();
    }
    turnFaceDown() {
        this.isFaceUp = false;
        this.element.src = Card.getSrc('back');
    }

    bottom() {
        var res = this;
        while(res.child) res = res.child;
        return res;
    }
    top() {
        var res = this;
        while(res.parent) res = res.parent;
        return res;
    }
    allChildren() {
        var arr = [this],
            res = this;
        while(res.child) arr.push(res = res.child);
        return arr;
    }
    inDropZone(x,y) {
        if (this.child) return false;
        return dist(x,y,this.slot.x,this.slot.y) <= 30;
    }
    get x() {return this.element.offsetLeft;}
    get y() {return this.element.offsetTop;}
    set x(x) {
        this.element.style.left = x;
        if(this.child) this.child.x = this.slot.x;
    }
    set y(y) {
        this.element.style.top = y;
        if(this.child) this.child.y = this.slot.y;
    }
    goto(x,y) {
        if (arguments.length == 1) [y,x] = [x.y,x.x];
        this.x = x; this.y = y;
    }
    
}



function dist(x1,y1,x2,y2) {var [dx,dy] = [x2-x1,y2-y1]; return Math.sqrt(dx*dx+dy*dy)};


window.onkeydown = function(event) {
    if(slots.columns.some(slot => slot.allChildren().some(card => !card.isFaceUp))) return;
    if(event.code != 'Enter') return;
    if(Card.deck.length + Card.drawn.length > 0) return;
    var interval = setInterval(() => {
        var bottoms = slots.columns.map(slot => slot.bottom()).filter(card => card.value != 'blank');
        if (bottoms.length == 0) clearInterval(interval);
        var lowest = bottoms.find(card => card.nvalue == Math.min.apply(null,bottoms.map(card => card.nvalue)));
        if (lowest.value == 'A') {var target = slots.aces.find(slot => slot.child == null)} 
        else {var target = slots.aces.map(slot => slot.bottom()).find(card => card.suit == lowest.suit);}
        lowest.placeOn(target);
        lowest.moveToTop();
    },50);
}

function auto() {
if (animation.active) return animation.nudge();

game.push(getGameState());
posmove = slots.columns.map(slot => slot.bottom()).find(card => card.isFaceDown);
if (posmove) {
    startAnimation('timeout')
    return posmove.turnFaceUp();
}
aces = slots.aces.map(slot => slot.bottom());
curspade = aces.find(card => card.suit == 'spades');
curheart = aces.find(card => card.suit == 'hearts');
curclub = aces.find(card => card.suit == 'clubs');
curdiamond = aces.find(card => card.suit == 'diamonds');
nextspade = curspade ? curspade.nvalue + 1 : 1;
nextheart = curheart ? curheart.nvalue + 1 : 1;
nextclub = curclub ? curclub.nvalue + 1 : 1;
nextdiamond = curdiamond ? curdiamond.nvalue + 1 : 1;
posmove = [slots.drawn,...slots.columns].map(slot => slot.bottom()).find(card => card.nvalue == nextspade && card.suit == 'spades');
if (posmove) return simulateMove(posmove,aces[0]);
posmove = [slots.drawn,...slots.columns].map(slot => slot.bottom()).find(card => card.nvalue == nextheart && card.suit == 'hearts');
if (posmove) return simulateMove(posmove,aces[1]);
posmove = [slots.drawn,...slots.columns].map(slot => slot.bottom()).find(card => card.nvalue == nextclub && card.suit == 'clubs');
if (posmove) return simulateMove(posmove,aces[2]);
posmove = [slots.drawn,...slots.columns].map(slot => slot.bottom()).find(card => card.nvalue == nextdiamond && card.suit == 'diamonds');
if (posmove) return simulateMove(posmove,aces[3]);
stacktops = slots.columns.map(slot => {
    var card = slot;
    if (card.child === null) return {color: 'any', value: 14};
    while(card.child && card.child.isFaceDown) card = card.child;
    return {color: card.child.color, value: card.child.nvalue};
});
drawn = slots.drawn.bottom()
if (drawn.value !== 'blank') stacktops.push({color: drawn.color, value: drawn.nvalue});
stackbottoms = slots.columns.map(slot => {
    var card = slot;
    if (card.child === null) return {color: 'any', value: 14};
    return {color: card.bottom().color, value: card.bottom().nvalue};
});
stacktopcards = slots.columns.map(slot => {
    var card = slot;
    if (card.child === null) return card;
    while(card.child && card.child.isFaceDown) card = card.child;
    return card.child;
});
if (drawn.value !== 'blank') stacktopcards.push(drawn);
stackbottomcards = slots.columns.map(slot => {
    var card = slot;
    if (card.child === null) card;
    return card.bottom();
});
for (i=0;i<stacktops.length;i++) {
if (!stacktopcards[i].parent || (stacktopcards[i].nvalue == 13 && stacktopcards[i].parent.value == 'blank')) continue;
posmove = stackbottoms.findIndex(card => card.color !== stacktops[i].color && card.value == stacktops[i].value + 1);
if (posmove > -1) return simulateMove(stacktopcards[i],stackbottomcards[posmove]);
}
if (Card.deck.length) {
    Card.draw3();
    return startAnimation('timeout');
}

if (slots.aces.every(slot => slot.bottom().value == 'K')) return reset();


if (moves) {
    moves = 0;
    Card.flipDeck();
    return startAnimation('timeout');
} else {
    reset();
}

}

var animation = {
    active: false,
    from: null,
    to: null,
    object: null,
    isTimeout: false,
    onComplete: null,
    step: 0,
    max: 0,
    clear() {
        if (!this.isTimeout) this.onComplete();
        this.from = null;
        this.to = null;
        this.object = null;
        this.target = null;
        this.onComplete = null;
        this.max = 0;
        this.isTimeout = false;
        this.step = 0;
        this.active = false;
    },
    nudge() {
        if (this.step >= this.max) {
            this.clear();
            return;
        }
        this.step++;
        if (this.isTimeout) return;
        var t = this.step / this.max;
        var x = this.from.x + t * (this.to.x - this.from.x);
        var y = this.from.y + t * (this.to.y - this.from.y);
        this.object.goto(x,y);
    }
}

function startAnimation(object='timeout',target,onComplete,length=100) {
    animation.active = true;
    animation.step = 0;
    animation.max = length;
    animation.isTimeout = object === 'timeout';
    if (!animation.isTimeout) {
    animation.from = {x:object.x,y:object.y};
    animation.to = {x:target.slot.x,y:target.slot.y};
    animation.object = object;
    animation.onComplete = onComplete;
    animation.target = target;
    }
}

var game = [];

archives = [];

function reset() {
archives.push(game);
game = [];
Card.all.forEach(card => card.element.remove());
Card.all = [];
Card.deck = [];
Card.drawn = [];
window.onload();
}

function simulateMove(self,target) {
    if (self.top() == slots.drawn && self !== self.bottom()) return; 
    if (!self.draggable) return;
    if (!self.isFaceUp) return;
    self.moveToTop();
    var hoveringOver = target;
    if (!self.isValidParent(hoveringOver)) {
        self.goto(self.parent.slot);
        return;
    }
    function onComplete() {
    if (self.parent) {
        if (hoveringOver !== self.parent) {
            self.parent.child = null;
            self.parent = null;
        }
    }
    if (hoveringOver) {
        self.parent = hoveringOver;
        if (slots.aces.includes(hoveringOver.top())) self.slotOffset = {x:0,y:0};
        hoveringOver.child = self;
        self.x = hoveringOver.slot.x;
        self.y = hoveringOver.slot.y;
    }
    if (![slots.drawn,slots.deck].includes(self.top())) {
        if (Card.deck.includes(self)) Card.deck.splice(Card.deck.indexOf(self),1);
        if (Card.drawn.includes(self)) Card.drawn.splice(Card.drawn.indexOf(self),1);
    }
    moves++;
    }
    startAnimation(self,target,onComplete);
}

function getGameState() {
    var columns = slots.columns.map(slot => slot.child === null ? ['empty'] : slot.allChildren().slice(1).map(card => card.isFaceDown ? 'face down' :  card.value + ' of ' + card.suit));
    var aces = slots.aces.map(slot => slot.child === null ? 'empty' : slot.bottom().value + ' of ' + slot.bottom().suit);
    var drawn = slots.drawn.allChildren().slice(1);
    var drawnvis = [];
    drawnvis.push(drawn.map(card => card.x).lastIndexOf(200));
    drawnvis.push(drawn.map(card => card.x).lastIndexOf(220));
    drawnvis.push(drawn.map(card => card.x).lastIndexOf(240));
    drawnvis = drawnvis.filter(n => n > -1);
    drawnvis = drawnvis.sort();
    drawnvis = drawnvis.map(i => drawn[i]);
    drawnvis = drawnvis.map(card => card.value + ' of ' + card.suit + ' at x:' + card.x);
    if (drawnvis.length == 0) drawnvis = ['empty'];
    var deck = slots.deck.child !== null ? 'face down' : 'empty';
    return {deck:deck,drawn:drawnvis,aces:aces,columns:columns};
}

var interval = false;

var moves = 0;

window.onload = function load(event) {
    
    slots = {};

    slots.deck = new Card('blank',null,100,75);
    slots.drawn = new Card('blank',null,200,75);
    slots.aces = [];
    slots.aces.push(new Card('blank',null,400,75));
    slots.aces.push(new Card('blank',null,500,75));
    slots.aces.push(new Card('blank',null,600,75));
    slots.aces.push(new Card('blank',null,700,75));
    slots.columns = [];
    slots.columns.push(new Card('blank',null,100,200));
    slots.columns.push(new Card('blank',null,200,200));
    slots.columns.push(new Card('blank',null,300,200));
    slots.columns.push(new Card('blank',null,400,200));
    slots.columns.push(new Card('blank',null,500,200));
    slots.columns.push(new Card('blank',null,600,200));
    slots.columns.push(new Card('blank',null,700,200));
    [slots.deck,slots.drawn,...slots.aces,...slots.columns]
    .forEach(slot => slot.draggable = false);
    Card.dealNewGame();
    startAnimation('timeout',null,null,200);

    if (!interval) interval = setInterval(auto, 0);
}