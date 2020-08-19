/*jslint maxparams: 4, maxdepth: 4, maxstatements: 20, maxcomplexity: 8, esversion: 6 */
(function ( window ) {

        const
            SHIP_DIRECTION_RIGHT = 'right',
            SHIP_DIRECTION_LEFT = 'left',
            SHIP_DIRECTION_UP = 'up',
            SHIP_DIRECTION_DOWN = 'down',

            BULLETS = [],
            ALIENS = [],

            MIN_SHIP_SPEED_X = 0,
            MAX_SHIP_SPEED_X = 5,

            MIN_SHIP_SPEED_Y = 0,
            MAX_SHIP_SPEED_Y = 3,

            BULLET_SPEED = 4,

            // The current speed is multiplied by this number. Probably just keep the value of one, seems pretty good.
            SHIP_MOVE_X_BASE = 1,
            SHIP_MOVE_Y_BASE = 1,

            MIN_STARS = 30,
            MAX_STARS = 40,
            ODDS_OF_MAKING_A_NEW_STAR = 0.1
        ;

        let
            lastTimeStamp = 0,
            lastDirectionRequest,
            currentShipDirectionHorizontal = SHIP_DIRECTION_RIGHT,
            currentShipDirectionVertical,
            currentShipSpeedHorizontal = 0,
            currentShipSpeedVertical = 0,

            furthestLeftSoFar = 0,
            furthestRightSoFar = 0,
            starFieldRight = 0,
            starFieldLeft = 0,

            cont,
            dbg,
            ship,
            star_field
        ;

        const

            document = window.document,

            LAND_1 = '\u25A9',

            SHIP_FACING_RIGHT = '\u1405',
            // ALIEN_SHIP_FACING_UP = '\u1403',
            ALIEN_SHIP_FACING_UP = '\u16DF',
            ALIEN_BEAM_START = '\u16D8',
            ALIEN_BEAM_START_B = '\u16D9',
            ALIEN_SHIP_RAY_1 = '\u15d1',
            ALIEN_SHIP_RAY_2 = '\u16e3',
            ALIEN_SHIP_WITH_PERSON = '\u16E4',
            PERSON_A = '\uC6C3',
            PERSON_B = '\uD83D\uDEB6\uFE0E',
            INTERESTING = [
                '\u005e',
                '\u02c4',
                '\u02c6',
                '\u02f0',
                '\u0311',
                '\u1403'
            ],

            createElement = ( tag, classes = [] ) => {
                const elem = document.createElement( tag );
                const ca = Array.isArray( classes ) ? classes : classes.split( ' ' );
                ca
                    .forEach(
                        ( c ) => {
                            elem.classList.add( c );
                        }
                    )
                ;
                return elem;
            },

            createDiv = ( classes = [] ) => {
                return createElement( 'div', classes );
            },

            getRandomIntInclusive = ( min, max ) => {
                min = Math.ceil( min );
                max = Math.floor( max );
                return Math.floor( Math.random() * (max - min + 1) ) + min; //The maximum is inclusive and the minimum is inclusive
            },

            getContainerBox = () => {
                return cont.getClientRects()[ 0 ];
            },

            getShipBox = () => {
                return ship.getClientRects()[ 0 ];
            },

            fireGun = () => {
                const
                    cb = getContainerBox(),
                    sb = getShipBox()
                ;

                // debugger;
                BULLETS
                    .push(
                        {
                            dir: currentShipDirectionHorizontal,
                            x: SHIP_DIRECTION_RIGHT === currentShipDirectionHorizontal ? sb.right : sb.left,
                            y: sb.top,
                        }
                    )
                ;
            },

            handleKeyPress = ( evt ) => {
                switch ( evt.code ) {
                    case 'ArrowRight':
                        lastDirectionRequest = SHIP_DIRECTION_RIGHT;
                        break;
                    case 'ArrowLeft':
                        lastDirectionRequest = SHIP_DIRECTION_LEFT;
                        break;
                    case 'ArrowUp':
                        lastDirectionRequest = SHIP_DIRECTION_UP;
                        break;
                    case 'ArrowDown':
                        lastDirectionRequest = SHIP_DIRECTION_DOWN;
                        break;
                    case 'Space':
                        fireGun();
                        break;
                }
            },

            maybeMoveStars = () => {
                if ( 0 === currentShipSpeedHorizontal ) {
                    return;
                }

                const m = (SHIP_DIRECTION_LEFT === currentShipDirectionHorizontal ? +1 : -1) * currentShipSpeedHorizontal;
                star_field
                    .childNodes
                    .forEach(
                        ( n ) => {
                            const ol = parseInt( n.style.left, 10 );
                            n.style.left = ol + m + 'px';
                        }
                    )
                ;
            },

            clamp = ( min, val, max ) => {
                return Math.max( min, Math.min( val, max ) );
            },

            maybeMoveShip = () => {
                const
                    curLeft = parseInt( ship.style.left, 10 ),
                    curTop = parseInt( ship.style.top, 10 ),
                    shipBox = getShipBox(),
                    contBox = getContainerBox()
                ;

                ship.classList.toggle( SHIP_DIRECTION_LEFT, currentShipDirectionHorizontal === SHIP_DIRECTION_LEFT );
                ship.classList.toggle( SHIP_DIRECTION_RIGHT, currentShipDirectionHorizontal === SHIP_DIRECTION_RIGHT );

                let
                    newLeft = curLeft,
                    newTop = curTop
                ;

                switch ( currentShipDirectionHorizontal ) {
                    case SHIP_DIRECTION_RIGHT:
                        newLeft = curLeft + (SHIP_MOVE_X_BASE * currentShipSpeedHorizontal);
                        break;
                    case SHIP_DIRECTION_LEFT:
                        newLeft = curLeft - (SHIP_MOVE_X_BASE * currentShipSpeedHorizontal);
                        break;
                }

                switch ( currentShipDirectionVertical ) {
                    case SHIP_DIRECTION_DOWN:
                        newTop = curTop + (SHIP_MOVE_Y_BASE * currentShipSpeedVertical);
                        break;
                    case SHIP_DIRECTION_UP:
                        newTop = curTop - (SHIP_MOVE_Y_BASE * currentShipSpeedVertical);
                        break;
                }

                newTop = clamp( 0, newTop, contBox.height - shipBox.height );
                newLeft = clamp( 0, newLeft, (contBox.width / 2) );

                ship.style.left = newLeft + 'px';
                ship.style.top = newTop + 'px';
            },

            setRandomStarPosition = ( star, box ) => {
                if ( !box ) {
                    box = getContainerBox();
                }
                const l = getRandomIntInclusive( box.left, box.right );
                const t = getRandomIntInclusive( box.top, box.bottom );
                star.style.left = l + 'px';
                star.style.top = t + 'px';
            },

            maybeDrawNewStars = () => {
                const maybeMoveBy = currentShipSpeedHorizontal * SHIP_MOVE_X_BASE;
                let maybeMakeNewStar = false;
                let leftOrRight = 'neither';

                switch ( currentShipDirectionHorizontal ) {
                    case SHIP_DIRECTION_RIGHT:
                        starFieldLeft -= maybeMoveBy;
                        starFieldRight += maybeMoveBy;
                        if ( starFieldRight > furthestRightSoFar ) {
                            maybeMakeNewStar = true;
                            furthestRightSoFar = starFieldRight;
                            leftOrRight = SHIP_DIRECTION_RIGHT;
                        }
                        break;

                    case SHIP_DIRECTION_LEFT:
                        starFieldLeft += maybeMoveBy;
                        starFieldRight -= maybeMoveBy;
                        if ( starFieldLeft > furthestLeftSoFar ) {
                            maybeMakeNewStar = true;
                            furthestLeftSoFar = starFieldLeft;
                            leftOrRight = SHIP_DIRECTION_LEFT;
                        }
                        break;
                }


                if ( maybeMakeNewStar ) {
                    const shouldMakeNewStar = Math.random() < ODDS_OF_MAKING_A_NEW_STAR;
                    if ( shouldMakeNewStar ) {
                        const star = createDiv();
                        const contBox = getContainerBox();
                        const box = {
                            top: contBox.top,
                            bottom: contBox.bottom,
                        };
                        if ( SHIP_DIRECTION_LEFT === leftOrRight ) {
                            box.left = 0 - furthestLeftSoFar;
                            box.right = 0 - furthestLeftSoFar + maybeMoveBy;
                        } else {
                            box.left = furthestRightSoFar - maybeMoveBy;
                            box.right = furthestRightSoFar;
                        }
                        setRandomStarPosition( star, box );
                        star_field.appendChild( star );
                    }
                }

            },

            maybeHandleShipDirection = () => {
                if ( !lastDirectionRequest ) {
                    return;
                }

                const
                    ld = lastDirectionRequest
                ;

                lastDirectionRequest = null;

                switch ( ld ) {
                    case SHIP_DIRECTION_RIGHT:
                    case SHIP_DIRECTION_LEFT:
                        if ( ld === currentShipDirectionHorizontal ) {
                            if ( currentShipSpeedHorizontal < MAX_SHIP_SPEED_X ) {
                                currentShipSpeedHorizontal++;
                            }
                            return;
                        }

                        if ( currentShipSpeedHorizontal > MIN_SHIP_SPEED_X ) {
                            currentShipSpeedHorizontal--;
                            return;
                        }

                        currentShipDirectionHorizontal = ld;
                        currentShipSpeedHorizontal = 1;
                        break;

                    case SHIP_DIRECTION_DOWN:
                    case SHIP_DIRECTION_UP:
                        if ( ld === currentShipDirectionVertical ) {
                            if ( currentShipSpeedVertical < MAX_SHIP_SPEED_Y ) {
                                currentShipSpeedVertical++;
                            }
                            return;
                        }

                        if ( currentShipSpeedVertical > MIN_SHIP_SPEED_Y ) {
                            currentShipSpeedVertical--;
                            return;
                        }

                        currentShipDirectionVertical = ld;
                        currentShipSpeedVertical = 1;
                        break;
                }

            },

            getOrMakeBulletElement = ( bullet ) => {
                if ( bullet.hasOwnProperty( 'obj' ) ) {
                    return bullet.obj;
                }

                const
                    obj = createDiv( 'bullet' )
                ;

                obj.style.left = bullet.x + 'px';
                obj.style.top = bullet.y + 'px';
                obj.appendChild( document.createTextNode( '-' ) );
                cont.appendChild( obj );
                bullet.obj = obj;
                return obj;
            },

            maybeDrawBullets = () => {
                const cb = getContainerBox();
                BULLETS
                    .forEach(
                        ( bullet, idx ) => {
                            const obj = getOrMakeBulletElement( bullet );

                            const
                                oldLeft = parseInt( obj.style.left, 10 ),
                                m = SHIP_DIRECTION_LEFT === bullet.dir ? -1 : 1,
                                newLeft = oldLeft + (m * BULLET_SPEED),
                                oob = (SHIP_DIRECTION_LEFT === bullet.dir && newLeft <= cb.left)
                                    ||
                                    (SHIP_DIRECTION_RIGHT === bullet.dir && newLeft >= cb.right)
                            ;

                            if ( oob ) {
                                BULLETS.splice( idx, 1 );
                                obj.remove();
                            } else {
                                obj.style.left = newLeft + 'px';
                            }

                        }
                    )
                ;
            },

            maybeDrawAliens = () => {

                if ( !ALIENS.length ) {
                    const alien = createDiv( 'alien' );
                    alien.appendChild( document.createTextNode( ALIEN_SHIP_FACING_UP ) );
                    cont.appendChild( alien );
                    ALIENS.push( alien );

                    const person_a = createDiv( 'person' );
                    person_a.appendChild( document.createTextNode( PERSON_A ) );
                    cont.appendChild( person_a );
                    ALIENS.push( person_a );

                    const person_b = createDiv( 'person' );
                    person_b.appendChild( document.createTextNode( PERSON_B ) );
                    cont.appendChild( person_b );
                    ALIENS.push( person_b );
                }
            },

            logDebug = () => {
                dbg.querySelector( '[data-debug~=direction]' ).innerText = currentShipDirectionHorizontal;
                dbg.querySelector( '[data-debug~="h-speed"]' ).innerText = currentShipSpeedHorizontal;
                dbg.querySelector( '[data-debug~="v-speed"]' ).innerText = currentShipSpeedVertical;
                dbg.querySelector( '[data-debug~="star-field-left"]' ).innerText = starFieldLeft;
                dbg.querySelector( '[data-debug~="star-field-right"]' ).innerText = starFieldRight;
            },

            mainEventLoop = ( ts ) => {
                lastTimeStamp = ts;

                maybeHandleShipDirection();
                logDebug();

                maybeMoveShip();
                maybeMoveStars();
                maybeDrawNewStars();
                maybeDrawBullets();
                // maybeDrawAliens();


                window.requestAnimationFrame( mainEventLoop );
            },

            createShip = () => {
                ship = createDiv( [ 'ship', SHIP_DIRECTION_RIGHT ] );
                ship.appendChild( document.createTextNode( SHIP_FACING_RIGHT ) );
                ship.style.left = '0';
                ship.style.top = '50px';
                return ship;
            },

            createLand = () => {
                const MAX_LAND_X = 50;
                let last_land_y = 1;
                const land_c = createDiv( 'land-container' );
                for ( let i = 0; i < MAX_LAND_X; i++ ) {
                    const land_v_stripe = createDiv( 'land-v-stripe' );
                    for ( let j = 0; j < 40; j++ ) {
                        const c = createDiv();
                        land_v_stripe.appendChild( c );
                    }
                    land_c.appendChild( land_v_stripe );
                }
                return land_c;
            },

            createStarField = () => {
                star_field = createDiv( 'star-field' );

                const newStarCount = getRandomIntInclusive( MIN_STARS, MAX_STARS );
                for ( let i = 0; i < newStarCount; i++ ) {
                    const star = createDiv();
                    setRandomStarPosition( star );
                    star_field.appendChild( star );
                }

                furthestRightSoFar = getContainerBox().width;
                starFieldRight = furthestRightSoFar;

                return star_field;
            },

            createEverything = () => {
                cont = createDiv( 'container' );
                document.body.appendChild( cont );
                cont.appendChild( createShip() );
                cont.appendChild( createStarField() );
                cont.appendChild( createLand() );
            },

            setupListeners = () => {
                document.addEventListener( 'keydown', handleKeyPress );
            },

            setupMainEventLoop = () => {
                window.requestAnimationFrame( mainEventLoop );
            },

            setupDebugger = () => {
                dbg = createDiv( 'debugger' );

                [ 'Direction', 'H Speed', 'V Speed', 'Star Field Left', 'Star Field Right' ]
                    .forEach(
                        ( i ) => {
                            const
                                c = createDiv(),
                                h = createDiv( 'header' ),
                                d = createDiv()
                            ;

                            h.appendChild( document.createTextNode( i ) );

                            d.setAttribute( 'data-debug', i.toLocaleLowerCase()
                                                           .replace( /\s/g, '-' ) );


                            c.appendChild( h );
                            c.appendChild( d );

                            dbg.appendChild( c );
                        }
                    )
                ;

                document.body.appendChild( dbg );
            },

            run = () => {
                createEverything();
                setupListeners();
                setupMainEventLoop();
                setupDebugger();
            },

            init = () => {
                run();
            }
        ;

        init();

    }
)( window );
