let Backgammon = (function () {
  class Player {
    constructor (name) {
      this.name = name
      this.pieces = []
      this.home = []

      this.isJailed = false
      this.canExit = false
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
    // testStart()

    function normalStart () {
      addPiecesToCell(0, B.player1, 5)
      addPiecesToCell(5, B.player2, 3)
      addPiecesToCell(6, B.player2, 5)
      addPiecesToCell(11, B.player1, 2)

      addPiecesToCell(12, B.player2, 2)
      addPiecesToCell(17, B.player1, 5)
      addPiecesToCell(18, B.player1, 3)
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
        B.round.dice.push(new Die(B.round.dice[0].number))
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

  B.movePiece = function (piece, fromCell, toCell) {
    if (B.round.state !== B.round.STATES.MOVE) return false

    let toCellNbr = B.board.indexOf(toCell)
    let fromCellNbr = piece.cellNbr

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
        piece.player.isJailed = false

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

// ************************* Hexi *************************

let g = hexi(800, 600, setup)

let startScene, gameOverScene

let cells = []
let dice = []
let selectedPiece

g.start()

function setup () {
  g.fps = 30
  g.backgroundColor = '#3e2311'

  // startScene = makeStartScene()
  makeGameScene()
  // gameOverScene = makeGameOverScene()
}

function makeStartScene () {
  let scene = g.group()

  let background = makeBackground()
  scene.add(background)

  let button = g.rectangle(
    100,
    100,
    'blue',
    'grey',
    2,
    g.canvas.width / 2 - 50,
    g.canvas.height / 2 - 50
  )
  scene.add(button)
  button.interact = true
  button.tap = () => {
    console.log('1')
    scene.visible = false
  }

  return scene
}

function makeGameScene () {
  let home1 = g.rectangle(
    g.canvas.width * 0.2,
    g.canvas.height * 0.4,
    'beige',
    'dark brown',
    0,
    10,
    10
  )
  home1.layer = -1
  Backgammon.player2.homeSprite = home1

  let home2 = g.rectangle(
    g.canvas.width * 0.2,
    g.canvas.height * 0.4,
    'beige',
    'dark brown',
    0,
    10,
    g.canvas.height * 0.55 + 20
  )
  home2.layer = -1
  Backgammon.player1.homeSprite = home2

  let diceArea = g.rectangle(
    g.canvas.width * 0.2,
    g.canvas.height * 0.2 - 40,
    '#291203',
    'dark brown',
    0,
    10,
    g.canvas.height * 0.4 + 20
  )
  diceArea.layer = -1

  diceArea.interact = true
  diceArea.tap = () => {
    let dice = Backgammon.rollDice()
    die1.text.content = dice[0].number
    die2.text.content = dice[1].number

    die1.putCenter(die1.text)
    die2.putCenter(die2.text)

    spinDie(die1)
    spinDie(die2)

    checkPossibleMoves()
  }

  function spinDie (die, counter) {
    die.rotation += 10
  }

  let die1 = g.rectangle(
    g.canvas.width * 0.1 - 15,
    g.canvas.height * 0.2 - 60,
    'beige',
    'beige',
    0,
    20,
    g.canvas.height * 0.4 + 30
  )
  die1.layer = -1
  die1.setPivot(0.5, 0.5)
  dice[0] = die1
  die1.text = g.text('Roll', '2em puzzler', 'black')
  die1.putCenter(die1.text)

  let die2 = g.rectangle(
    g.canvas.width * 0.1 - 15,
    g.canvas.height * 0.2 - 60,
    'beige',
    'beige',
    0,
    g.canvas.width * 0.1 - 15 + 30,
    g.canvas.height * 0.4 + 30
  )
  die2.layer = -1
  die2.setPivot(0.5, 0.5)
  dice[1] = die2
  die2.text = g.text('Roll', '2em puzzler', 'black')
  die2.putCenter(die2.text)

  let playArea1 = g.rectangle(
    g.canvas.width * 0.4 - 20,
    g.canvas.height * 0.5 - 15,
    'beige',
    'dark brown',
    0,
    g.canvas.width * 0.2 + 20,
    10
  )
  playArea1.visible = false
  playArea1.layer = -1
  let playArea2 = g.rectangle(
    g.canvas.width * 0.4 - 20,
    g.canvas.height * 0.5 - 15,
    'beige',
    'dark brown',
    0,
    g.canvas.width * 0.6 + 10,
    10
  )
  playArea2.visible = false
  playArea2.layer = -1
  let playArea3 = g.rectangle(
    g.canvas.width * 0.4 - 20,
    g.canvas.height * 0.5 - 15,
    'beige',
    'dark brown',
    0,
    g.canvas.width * 0.2 + 20,
    g.canvas.height * 0.5 + 5
  )
  playArea3.visible = false
  playArea3.layer = -1
  let playArea4 = g.rectangle(
    g.canvas.width * 0.4 - 20,
    g.canvas.height * 0.5 - 15,
    'beige',
    'dark brown',
    0,
    g.canvas.width * 0.6 + 10,
    g.canvas.height * 0.5 + 5
  )
  playArea4.visible = false
  playArea4.layer = -1

  cells[0] = Backgammon.board[0].sprite = makeCell('#FCF3CF', playArea1, 0)
  cells[0].cell = Backgammon.board[0]
  cells[1] = Backgammon.board[1].sprite = makeCell('#291203', playArea1, 1)
  cells[1].cell = Backgammon.board[1]
  cells[2] = Backgammon.board[2].sprite = makeCell('#FCF3CF', playArea1, 2)
  cells[2].cell = Backgammon.board[2]
  cells[3] = Backgammon.board[3].sprite = makeCell('#291203', playArea1, 3)
  cells[3].cell = Backgammon.board[3]
  cells[4] = Backgammon.board[4].sprite = makeCell('#FCF3CF', playArea1, 4)
  cells[4].cell = Backgammon.board[4]
  cells[5] = Backgammon.board[5].sprite = makeCell('#291203', playArea1, 5)
  cells[5].cell = Backgammon.board[5]

  cells[6] = Backgammon.board[6].sprite = makeCell('#FCF3CF', playArea2, 0)
  cells[6].cell = Backgammon.board[6]
  cells[7] = Backgammon.board[7].sprite = makeCell('#291203', playArea2, 1)
  cells[7].cell = Backgammon.board[7]
  cells[8] = Backgammon.board[8].sprite = makeCell('#FCF3CF', playArea2, 2)
  cells[8].cell = Backgammon.board[8]
  cells[9] = Backgammon.board[9].sprite = makeCell('#291203', playArea2, 3)
  cells[9].cell = Backgammon.board[9]
  cells[10] = Backgammon.board[10].sprite = makeCell('#FCF3CF', playArea2, 4)
  cells[10].cell = Backgammon.board[10]
  cells[11] = Backgammon.board[11].sprite = makeCell('#291203', playArea2, 5)
  cells[11].cell = Backgammon.board[11]

  cells[23] = Backgammon.board[23].sprite = makeCell('#291203', playArea3, 0)
  cells[23].cell = Backgammon.board[23]
  cells[22] = Backgammon.board[22].sprite = makeCell('#FCF3CF', playArea3, 1)
  cells[22].cell = Backgammon.board[22]
  cells[21] = Backgammon.board[21].sprite = makeCell('#291203', playArea3, 2)
  cells[21].cell = Backgammon.board[21]
  cells[20] = Backgammon.board[20].sprite = makeCell('#FCF3CF', playArea3, 3)
  cells[20].cell = Backgammon.board[20]
  cells[19] = Backgammon.board[19].sprite = makeCell('#291203', playArea3, 4)
  cells[19].cell = Backgammon.board[19]
  cells[18] = Backgammon.board[18].sprite = makeCell('#FCF3CF', playArea3, 5)
  cells[18].cell = Backgammon.board[18]

  cells[17] = Backgammon.board[17].sprite = makeCell('#291203', playArea4, 0)
  cells[17].cell = Backgammon.board[17]
  cells[16] = Backgammon.board[16].sprite = makeCell('#FCF3CF', playArea4, 1)
  cells[16].cell = Backgammon.board[16]
  cells[15] = Backgammon.board[15].sprite = makeCell('#291203', playArea4, 2)
  cells[15].cell = Backgammon.board[15]
  cells[14] = Backgammon.board[14].sprite = makeCell('#FCF3CF', playArea4, 3)
  cells[14].cell = Backgammon.board[14]
  cells[13] = Backgammon.board[13].sprite = makeCell('#291203', playArea4, 4)
  cells[13].cell = Backgammon.board[13]
  cells[12] = Backgammon.board[12].sprite = makeCell('#FCF3CF', playArea4, 5)
  cells[12].cell = Backgammon.board[12]

  for (let piece of Backgammon.player1.pieces) {
    let pieceSprite = makePiece(piece.cellNbr, Backgammon.player1)
    pieceSprite.piece = piece
    piece.pieceSprite = pieceSprite
  }
  for (let piece of Backgammon.player2.pieces) {
    let pieceSprite = makePiece(piece.cellNbr, Backgammon.player2)
    pieceSprite.piece = piece
    piece.pieceSprite = pieceSprite
  }
}

function makeGameOverScene () {
  let scene = g.group()
  scene.visible = false

  let background = makeBackground()
  scene.add(background)

  return scene
}

function makeBackground () {
  let background = g.rectangle(
    g.canvas.width,
    g.canvas.height,
    'Black',
    'Black',
    0,
    0,
    0
  )
  background.alpha = 0.8

  return background
}

function makeCell (color, area, cellNbr) {
  let cellWidth = (g.canvas.width * 0.4 - 20) / 6

  let cell = g.rectangle(
    cellWidth,
    g.canvas.height * 0.5 - 15,
    color,
    'black',
    0,
    area.x + cellWidth * cellNbr,
    area.y
  )
  cell.layer = -1

  cell.pieces = []

  return cell
}

function makePiece (cellNbr, player) {
  let piece = g.circle(
    (g.canvas.width * 0.4 - 20) / 6 - 5,
    player === Backgammon.player1 ? 'white' : 'black',
    'grey',
    2
  )
  piece.layer = -1

  piece.player = player

  piece.draggable = true
  piece.interact = true

  piece.press = () => {
    if (!selectedPiece) {
      selectedPiece = piece
    }
  }

  piece.release = () => {
    if (!selectedPiece || piece !== selectedPiece) return

    let hitHome = g.hitTestPoint(g.pointer, Backgammon.round.player.homeSprite)

    if (hitHome) {
      if (Backgammon.exitPiece(selectedPiece.piece)) {
        selectedPiece.interact = false
        // selectedPiece.draggable = false
        selectedPiece.player.homeSprite.putCenter(selectedPiece)
        selectedPiece.cell.pieces.splice(selectedPiece.cell.pieces.indexOf(piece), 1)
        console.log('Exit')
        if (Backgammon.checkWin(selectedPiece.piece.player)) {
          console.log('Win!!')
          gameOverScene.visible = true
        }
      } else {
        console.log('No exit')
        moveBackPiece(selectedPiece)
      }
    } else {
      movePiece()
      clearJailedPieces()
      checkPossibleMoves()
    }

    selectedPiece = null
    console.log(!selectedPiece)
  }

  addPieceToCell(piece, cellNbr)

  return piece

  function clearJailedPieces () {
    for (let piece of Backgammon.round.player.pieces) {
      if (piece.isJailed) {
        console.log('found piece that should be jailed')
        if (Backgammon.round.player === Backgammon.player1) {
          Backgammon.player2.homeSprite.putCenter(piece.pieceSprite)
        } else {
          Backgammon.player1.homeSprite.putCenter(piece.pieceSprite)
        }
      }
    }
  }

  function movePiece () {
    let cell = findCellOnPointer()
    if (!cell) return moveBackPiece(piece)
    let allowedMove = Backgammon.movePiece(piece.piece, piece.cell.cell, cell.cell)
    if (allowedMove) {
      addPieceToCell(piece, cells.indexOf(cell))
    } else {
      console.log('No move')
      moveBackPiece(piece)
    }
  }
}

function checkPossibleMoves () {
  clearPossibleMoveMarkers()
  // console.log('checking moves hexi')
  for (let cell of cells) {
    if (cell.cell.possibleMove) {
      addPossibleMoveMarker(cell)
    }
  }
}

function addPossibleMoveMarker (cell) {
  let markerSize = cell.width / 2

  let marker = g.circle(
    markerSize,
    'darkgreen',
    'rgba(0, 0, 0, 0.1)',
    2
  )

  cell.possibleMoveMarker = marker

  if (cell.cell.cellNbr < 12) {
    cell.putBottom(marker, 0, -markerSize)
  } else {
    cell.putTop(marker, 0, markerSize)
  }
}

function clearPossibleMoveMarkers () {
  for (let cell of cells) {
    if (cell.possibleMoveMarker) {
      try {
        g.remove(cell.possibleMoveMarker)
      } catch (dumbError) {
        // console.log('hexi tried crashing')
      }
    }
  }
}

function moveBackPiece (piece) {
  addPieceToCell(piece, piece.piece.cellNbr)
}

function findCellOnPointer () {
  for (let cell of cells) {
    if (g.hitTestPoint(g.pointer, cell)) {
      return cell
    }
  }
}

function addPieceToCell (piece, cellNbr) {
  let cell = cells[cellNbr]

  if (cell && piece.cell && piece.cell.pieces && cell.pieces) {
    piece.cell.pieces.splice(cell.pieces.indexOf(piece), 1)
  }

  piece.cell = cell

  try {
    cell.pieces.push(piece)
  } catch (e) {
    console.log('add piece to cell error', e)
  }

  let pieceHeight = piece.radius * 2
  let piecesInCell = cell.pieces.length

  if (cellNbr < 12) {
    cell.putTop(piece, 0, pieceHeight * piecesInCell)
  } else {
    cell.putBottom(piece, 0, -pieceHeight * piecesInCell)
  }
}

// jaila direkt

// ta bort kanter runt cirklar?

// flytta invisible scenes utanför skärmen

// max bredd?

// player.isJailed = false?
