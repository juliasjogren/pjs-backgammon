let Backgammon = (function () {
  class Player {
    constructor (name) {
      this.name = name
      this.pieces = []
      this.home = []

      this.isJailed = false
      this.canExit = false
    }

    getJailedPiece() {
      for (let piece of this.pieces) {
        if (piece.isJailed) return piece
      }
    }
  }

  class Cell {
    constructor (cellNbr) {
      this.cellNbr = cellNbr
      this.pieces = []
    }

    removePiece (piece) {
      let pieceIndex = this.pieces.indexOf(piece)
      console.log('remove piece', pieceIndex, this.pieces.length)
      this.pieces.splice(pieceIndex, 1)
      console.log('removed piece', this.pieces.length)
    }
  }

  class Piece {
    constructor (player, cellNbr) {
      this.player = player
      this.cellNbr = cellNbr
      this.isJailed = false

      player.pieces.push(this) //
    }
  }

  class Die {
    constructor (number) {
      if (number) {
        this.number = number
      } else {
        this.number = Math.floor(Math.random() * 6) + 1
      }
      this.isUsed = false
    }
  }

  class Round {
    constructor (player) {
      this.player = player

      this.dice = []

      this.STATES = {
        DICE: 'DICE',
        MOVE: 'MOVE'
      }

      this.state = this.STATES.DICE
    }
  }

  let B = {}

  B.setupGame = function () {
    resetBoard()

    B.player1 = new Player('Player One')
    B.player2 = new Player('Player Two')
    B.player1.opponent = B.player2
    B.player2.opponent = B.player1
    setStartPositions()

    B.round = new Round(B.player1)
  }

  function resetBoard () {
    B.board = []

    for (let i = 0; i < 24; ++i) {
      B.board.push(new Cell(i))
    }
  }

  function setStartPositions () {
    normalStart()
    //testStart()

    function normalStart () {
      addPiecesToCell(0, B.player1, 5)
      addPiecesToCell(4, B.player2, 3)
      addPiecesToCell(6, B.player2, 5)
      addPiecesToCell(11, B.player1, 2)

      addPiecesToCell(12, B.player2, 2)
      addPiecesToCell(17, B.player1, 5)
      addPiecesToCell(19, B.player1, 3)
      addPiecesToCell(23, B.player2, 5)
    }

    function testStart () {
      addPiecesToCell(23, B.player1, 5)
      addPiecesToCell(22, B.player1, 3)
      addPiecesToCell(21, B.player1, 5)
      addPiecesToCell(20, B.player1, 2)

      addPiecesToCell(0, B.player2, 2)
      addPiecesToCell(1, B.player2, 5)
      addPiecesToCell(2, B.player2, 3)
      addPiecesToCell(3, B.player2, 5)
    }

    function addPiecesToCell (cellNbr, player, pieces) {
      for (let i = 0; i < pieces; ++i) {
        let piece = new Piece(player, cellNbr)
        let cell = B.board[cellNbr]
        cell.pieces.push(piece)
        piece.cell = cell
      }
    }
  }

  B.rollDice = function () {
    if (B.round.state === B.round.STATES.DICE) {
      B.round.dice = []
      B.round.dice.push(new Die())
      B.round.dice.push(new Die())
      if (B.round.dice[0].number === B.round.dice[1].number) {
        B.round.dice.unshift(new Die(B.round.dice[0].number))
        console.log('Double dice!')
      }
      B.round.state = B.round.STATES.MOVE
      checkPossibleMoves()
    }
    return B.round.dice
  }

  B.exitPiece = function (piece) {
    let die = canExit(piece)

    if (die) {
      if (piece.player === B.player1) {
        piece.cellNbr = 24
      } else {
        piece.cellNbr = -1
      }
      piece.cell.removePiece(piece)

      die.isUsed = true
      piece.player.home.push(piece)
      nextRound()
      return true
    } else {
      return false
    }
  }

  function canExit (piece) {
    if (piece.player === B.player1) {
      for (let p of piece.player.pieces) {
        if (p.cellNbr < 18) return false
      }
    } else {
      for (let p of piece.player.pieces) {
        if (p.cellNbr > 5) return false
      }
    }

    let sortedDice = B.round.dice.sort((die1, die2) => die1.number - die2.number)
    let cellsLeft
    if (B.round.player === B.player1) {
      cellsLeft = 24 - piece.cellNbr
    } else {
      cellsLeft = 1 + piece.cellNbr
    }

    console.log('steps to exit', cellsLeft)

    for (let i = 0; i < sortedDice.length; ++i) {
      // console.log('testing exit', sortedDice[i].number, cellsLeft, sortedDice[i].number >= cellsLeft, !sortedDice[i].isUsed)
      if (!sortedDice[i].isUsed && sortedDice[i].number >= cellsLeft) {
        return sortedDice[i]
      }
    }

    return false
  }

  B.checkWin = function (player) {
    return player.home.length === 15
  }

  B.movePiece = function (piece, fromCellNbr, toCellNbr) {
    if (B.round.state !== B.round.STATES.MOVE) return false

    let toCell = B.board[toCellNbr]
    let fromCell = piece.cell

    let stepsNeeded = Math.abs(toCellNbr - fromCellNbr)

    for (let die of B.round.dice) {
      if (!moveIsPossible(piece, die.number)) continue
      if (!die.isUsed && die.number === stepsNeeded) {
        die.isUsed = true
        piece.cell.removePiece(piece)
        piece.cell = toCell
        piece.cellNbr = toCellNbr
        piece.cell.pieces.push(piece)
        piece.isJailed = false
        
        if (!piece.player.getJailedPiece()) {
          piece.player.isJailed = false
        }

        if (piece.cell.pieces[0] && piece.cell.pieces[0].player !== piece.player) {
          console.log('jail time')
          piece.cell.pieces[0].isJailed = true
          piece.cell.pieces[0].player.isJailed = true
          piece.cell.pieces.splice(piece.cell.pieces.indexOf(piece.cell.pieces[0]), 1)
        }

        // tries to start next round if all dice are used otherwise show remaining moves
        if (!nextRound()) checkPossibleMoves()

        return true
      }
    }
    return false
  }

  function nextRound () {
    if (B.round.dice[2] && !B.round.dice[2].isUsed) return
    if (B.round.dice[0].isUsed && B.round.dice[1].isUsed) {
      if (B.round.player === B.player1) {
        B.round = new Round(B.player2)
      } else {
        B.round = new Round(B.player1)
      }
      return true
    }
    return false
  }

  function checkPossibleMoves () {
    clearPossibleMoves()
    let moves = 0
    for (let die of B.round.dice) {
      if (die.isUsed) continue
      for (let piece of Backgammon.round.player.pieces) {
        if (moveIsPossible(piece, die.number)) {
          moves++
        }
      }
    }

    if (!moves) {
      console.log('No possible moves, skipping to next turn')
      for (let die of B.round.dice) die.isUsed = true
      nextRound()
    }
  }

  function clearPossibleMoves () {
    for (let cell of B.board) {
      cell.possibleMove = false
    }
  }

  function moveIsPossible (piece, steps) {
    if (B.round.player !== piece.player) return false
    if (piece.player.isJailed && !piece.isJailed) return false

    if (piece.isJailed) {
      console.log('trying to move jailed piece')
      if (piece.player === Backgammon.player1) {
        piece.cellNbr = -1
      } else {
        piece.cellNbr = 24
      }
    }

    if (canExit(piece)) return true

    let toCellNbr
    if (B.round.player === B.player1) toCellNbr = piece.cellNbr + steps
    else toCellNbr = piece.cellNbr - steps
    let toCell = B.board[toCellNbr]

    if (!toCell) return false
    if (toCell.pieces.length >= 2 && toCell.pieces[0].player !== B.round.player) return false

    toCell.possibleMove = true

    return true
  }

  return B
})()

Backgammon.setupGame()

console.log(Backgammon)

//---------------------------------PIXI--------------------------------------

let colors = {
  background: 0x86592d,
  home: 0xfcf1cf,
  playArea: 0x86592d,
  diceArea: 0x27190c,
  cellDark: 0x27190c,
  celllight: 0xfcf1cf,
  pieceOne: 0xfcf1cf,
  pieceTwo: 0x27190c,
  die: 0xfcf1cf,
  moveMarker: 0x4d9900,
  pip: 0x000000
}
let gameDiv = document.getElementById('game')

let gameWidth = gameDiv.offsetWidth
let gameHeight = gameDiv.offsetHeight

let game = new PIXI.Application({width: gameWidth, height: gameHeight, antialias: true})

gameDiv.appendChild(game.view)

game.renderer.backgroundColor = colors.background
game.renderer.autoResize = true

drawGame()

function drawGame () {
  let backgroundLayer = new PIXI.Container()
  backgroundLayer.zIndex = -1
  game.stage.addChild(backgroundLayer)
  let foregroundLayer = new PIXI.Container()
  foregroundLayer.zIndex = 1
  game.stage.addChild(foregroundLayer)
  let activeLayer = new PIXI.Container()
  activeLayer.zIndex = 2
  game.stage.addChild(activeLayer)

  let homeWidth = gameWidth / 7
  let homeHeight = gameHeight / 3

  let padding = 15

  let playAreaWidth = (gameWidth / 2) - homeWidth / 2 - ((padding * 4) / 2)
  let playAreaHeight = (gameHeight / 2) - ((padding * 3) / 2)

  let cellWidth = playAreaWidth / 6
  let cellHeight = playAreaHeight

  let pieceSize = cellWidth * 0.7

  let moveMarkerSize = cellWidth / 4

  let diceAreaWidth = homeWidth
  let diceAreaHeight = homeHeight - padding * 4

  let dieWidth = diceAreaHeight / 3
  let dieHeight = diceAreaHeight / 3
  let pipSize = dieWidth / 5

  let cells = []
  let home1 = makeHomeArea(padding, padding, homeWidth, homeHeight, colors.home)
  let home2 = makeHomeArea(padding, gameHeight - homeHeight - padding, homeWidth, homeHeight, colors.home)
  let diceArea = makeDiceArea(padding, homeHeight + padding * 2)
  let die1 = makeDie(padding + diceAreaWidth / 2 - dieWidth / 2, padding * 3 + homeHeight, dieWidth, dieHeight, colors.die)
  let die2 = makeDie(padding + diceAreaWidth / 2 - dieWidth / 2, padding * 4 + homeHeight + dieHeight, dieWidth, dieHeight, colors.die)
  let playArea1 = makePlayArea(homeWidth + padding * 2, padding)
  let playArea2 = makePlayArea(homeWidth + playAreaWidth + padding * 3, padding)
  let playArea3 = makePlayArea(homeWidth + padding * 2, gameHeight - padding - playAreaHeight)
  let playArea4 = makePlayArea(homeWidth + playAreaWidth + padding * 3, gameHeight - padding - playAreaHeight)

  Backgammon.player1.homeSprite = home2
  Backgammon.player2.homeSprite = home1
  Backgammon.player1.activePiece = makeActivePiece(colors.pieceOne)
  Backgammon.player2.activePiece = makeActivePiece(colors.pieceTwo)

  let selectedPiece

  for (let i = 0; i < 6; i++) {
    let color = i % 2 === 0 ? colors.cellDark : colors.celllight
    cells.push(makeCell(playArea1.x + cellWidth * i, playArea1.y, color))
  }

  for (let i = 0; i < 6; i++) {
    let color = i % 2 === 0 ? colors.cellDark : colors.celllight
    cells.push(makeCell(playArea2.x + cellWidth * i, playArea2.y, color))
  }

  for (let i = 5; i >= 0; i--) {
    let color = i % 2 === 0 ? colors.celllight : colors.cellDark
    cells.push(makeCell(playArea4.x + cellWidth * i, playArea4.y, color, true))
  }

  for (let i = 5; i >= 0; i--) {
    let color = i % 2 === 0 ? colors.celllight : colors.cellDark
    cells.push(makeCell(playArea3.x + cellWidth * i, playArea3.y, color, true))
  }

  for (let piece of Backgammon.player1.pieces) {
    let pieceSprite = makePiece(cells[piece.cellNbr], piece)
  }

  for (let piece of Backgammon.player2.pieces) {
    let pieceSprite = makePiece(cells[piece.cellNbr], piece)
  }

  function makeActivePiece (color) {
    let piece = makeCircle(0, 0, pieceSize, color)
    piece.visible = false

    piece.hide = function () {
      piece.visible = false
    }
    piece.show = function () {
      piece.visible = true
    }

    activeLayer.addChild(piece)
    game.ticker.add(() => {
      let pointer = game.renderer.plugins.interaction.mouse.global
      piece.x = pointer.x
      piece.y = pointer.y
    })

    return piece
  }

  function makeInteractive (sprite, callback) {
    sprite.interactive = true
    sprite.buttonMode = true
    sprite.click = callback
  }

  function makePlayArea (x, y) {
    let area = makeRectangle(x, y, playAreaWidth, playAreaHeight, colors.playArea)
    area.visible = false
    return area
  }

  function makeHomeArea (x, y) {
    let home = makeRoundedRectangle(x, y, homeWidth, homeHeight, colors.home)
    backgroundLayer.addChild(home)
    makeInteractive(home, function () {
      let activePlayer = Backgammon.round.player
      if (activePlayer.homeSprite === home) {
        if (activePlayer.activePiece.visible) {
          let successfulExit = Backgammon.exitPiece(selectedPiece.piece)
          if (successfulExit) {
            activePlayer.activePiece.hide()
            if (Backgammon.checkWin(activePlayer)) console.log(activePlayer.name + 'Win!!')
          } else {
            let fromCellNbr = selectedPiece.piece.cellNbr
            let fromCell = cells[fromCellNbr]
            makePiece(fromCell, selectedPiece.piece)
            activePlayer.activePiece.hide()
          }
        }
      } else {
        if (activePlayer.isJailed) {
          selectedPiece = activePlayer.opponent.homeSprite.children.pop()
          activePlayer.activePiece.show()
        }
      }
    })
    return home
  }

  function makeDiceArea (x, y) {
    let area = makeRoundedRectangle(x, y, diceAreaWidth, diceAreaHeight, colors.diceArea)
    backgroundLayer.addChild(area)
    return area
  }

  function makeDie (x, y) {
    let die = makeRoundedRectangle(x, y, dieWidth, dieHeight, colors.die)
    foregroundLayer.addChild(die)
    makeInteractive(die, function () {
      console.log('Die click')
      let dice = Backgammon.rollDice()
      die1.setNumber(dice[0].number)
      die2.setNumber(dice[1].number)
    })

    die.setNumber = function (number) {
      switch (number) {
        case 1:
          die.one()
          break
        case 2:
          die.two()
          break
        case 3:
          die.three()
          break
        case 4:
          die.four()
          break
        case 5:
          die.five()
          break
        case 6:
          die.six()
          break
      }
    }

    die.zero = function () {
      die.children.length = 0
    }
    die.one = function () {
      die.zero()
      let pip = makePip()
      pip.x = dieWidth / 2
      pip.y = dieHeight / 2
    }
    die.two = function () {
      die.zero()
      let pip = makePip()
      pip.x = dieWidth / 3
      pip.y = dieHeight / 2
      pip = makePip()
      pip.x = (dieWidth / 3) * 2
      pip.y = dieHeight / 2
    }
    die.three = function () {
      die.zero()
      let pip = makePip()
      pip.x = dieWidth / 4
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = dieWidth / 2
      pip.y = dieHeight / 2
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = dieWidth / 4
    }
    die.four = function () {
      die.zero()
      let pip = makePip()
      pip.x = dieWidth / 4
      pip.y = dieHeight / 4
      pip = makePip()
      pip.x = dieWidth / 4
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = dieWidth / 4
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = (dieHeight / 4) * 3
    }
    die.five = function () {
      die.zero()
      let pip = makePip()
      pip.x = dieWidth / 4
      pip.y = dieHeight / 4
      pip = makePip()
      pip.x = dieWidth / 4
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = dieWidth / 4
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = dieHeight / 2
      pip.y = dieHeight / 2
    }
    die.six = function () {
      die.zero()
      let pip = makePip()
      pip.x = dieWidth / 4
      pip.y = dieHeight / 4
      pip = makePip()
      pip.x = dieWidth / 4
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = dieWidth / 4
      pip = makePip()
      pip.x = (dieHeight / 4) * 3
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = dieHeight / 2
      pip.y = (dieHeight / 4) * 3
      pip = makePip()
      pip.x = dieHeight / 2
      pip.y = dieHeight / 4
    }

    function makePip () {
      let pip = makeCircle(0, 0, pipSize, colors.pip)
      die.addChild(pip)
      return pip
    }

    return die
  }

  function checkDice () {
    let dice = Backgammon.round.dice
    let allUsed = true
    for (let die of dice) {
      if (!die.isUsed) {
        allUsed = false
      }
    }
    if (allUsed) {
      die1.zero()
      die2.zero()
    }
  }

  function makeCell (x, y, color, isRotated) {
    let cell = makeTriangle(x, y, cellWidth, cellHeight, color, isRotated)
    backgroundLayer.addChild(cell)
    let moveMarker = makeMoveMarker()
    cell.addChild(moveMarker)
    moveMarker.x = cellWidth / 2
    moveMarker.y = cellHeight - padding
    moveMarker.visible = false

    cell.hideMarker = function () {
      moveMarker.visible = false
    }

    cell.showMarker = function () {
      moveMarker.visible = true
    }

    makeInteractive(cell, function () {
      let activePlayer = Backgammon.round.player
      if (activePlayer.activePiece.visible) {
        let toCellNbr = cells.indexOf(cell)
        let fromCellNbr = selectedPiece.piece.cellNbr
        let successfulMove = Backgammon.movePiece(selectedPiece.piece, fromCellNbr, toCellNbr)
        activePlayer.activePiece.hide()
        if (!successfulMove) {
          if (selectedPiece.piece.isJailed) return activePlayer.opponent.homeSprite.addChild(selectedPiece)
          return makePiece(cells[fromCellNbr], selectedPiece.piece)
        }
        if (cell.children[1] && cell.children[1].piece.isJailed) {
          let jailPiece = cell.children[1]
          activePlayer.homeSprite.addChild(jailPiece)
        }
        makePiece(cell, selectedPiece.piece)
        checkDice()
      } else {
        if (cell.children.length === 1) return
        if (cell.children[1].piece.player !== activePlayer) return
        selectedPiece = cell.children.pop()
        activePlayer.activePiece.show()
      }
    })
    return cell
  }

  function makePiece (cell, piece) {
    let color = piece.player === Backgammon.player1 ? colors.pieceOne : colors.pieceTwo
    let pieceSprite = makeCircle(0, 0, pieceSize, color, true)
    cell.addChild(pieceSprite)
    pieceSprite.x = cellWidth / 2
    pieceSprite.y = pieceSize / 2 + pieceSize * (cell.children.length - 2)

    pieceSprite.piece = piece
    piece.pieceSprite = pieceSprite
    return pieceSprite
  }

  function makeMoveMarker () {
    let circle = makeCircle(0, 0, moveMarkerSize, colors.moveMarker)
    return circle
  }

  function makeRoundedRectangle (x, y, width, height, fillColor, lineColor) {
    let rectangle = new PIXI.Graphics
    if (lineColor !== undefined) {
      rectangle.lineStyle(2, lineColor)
    }
    rectangle.beginFill(fillColor)
    rectangle.drawRoundedRect(0, 0, width, height, 10)
    rectangle.endFill()
    rectangle.x = x
    rectangle.y = y

    return rectangle
  }

  function makeCircle (x, y, size, color) {
    let circle = new PIXI.Graphics()

    size = size / 2

    circle.beginFill(color)
    circle.lineStyle(1, 0x000000)
    circle.drawCircle(0, 0, size)
    circle.endFill()
    circle.x = x
    circle.y = y

    game.stage.addChild(circle)
    return circle
  }

  function makeTriangle (x, y, width, height, color, isRotated) {
    let triangle = new PIXI.Graphics()

    triangle.beginFill(color)
    triangle.drawPolygon([
      0, 0,
      width, 0,
      width / 2, height
    ])
    triangle.endFill()
    triangle.x = x
    triangle.y = y

    if (isRotated) {
      triangle.pivot.set(width, height)
      triangle.rotation = Math.PI
    }

    game.stage.addChild(triangle)
    return triangle
  }

  function makeRectangle (x, y, width, height, color) {
    let rectangle = new PIXI.Graphics()

    rectangle.beginFill(color)
    rectangle.drawRect(0, 0, width, height)
    rectangle.x = x
    rectangle.y = y
    rectangle.endFill()

    game.stage.addChild(rectangle)
    return rectangle
  }
}
