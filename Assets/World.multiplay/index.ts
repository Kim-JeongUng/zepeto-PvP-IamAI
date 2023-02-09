import {DataStorage} from "ZEPETO.Multiplay.DataStorage";
import {Sandbox, SandboxOptions, SandboxPlayer} from "ZEPETO.Multiplay";
import {Player, sVector3, sQuaternion, SyncTransform, PlayerAdditionalValue, ZepetoAnimationParam} from "ZEPETO.Multiplay.Schema";

export default class extends Sandbox {
    private sessionIdQueue: string[] = [];
    private InstantiateObjCaches : InstantiateObj[] = [];
    private masterClient = () => this.loadPlayer(this.sessionIdQueue[0]);

    private masterClientSessionId: string;
    private NumberOfAI: number = 10;
    private PlayerReadyAI: number = 0;
    private isReadyAI: boolean = false;
    private TickIndex: number = 0;
    private leftPlayerNum: number = 1;
    private StartPlayerNum: number = 1;

    MESSAGE_TYPE = {
        OnPlayGesture: "OnPlayGesture",
        OnKillPlayer: "OnKillPlayer",
        OnEndGame: "OnEndGame",
        LeftPlayer:"LeftPlayer",
        GameStart:"GameStart",
        FirstSyncPlayer:"FirstSyncPlayer",
        FirstSyncAI:"FirstSyncAI",
        ReadyAI:"ReadyAI",
        CheckMaster:"CheckMaster",
        ReceiveAllPlayer:"ReceiveAllPlayer",
        ChangeNumberOfAI:"ChangeNumberOfAI",
        AIdestination:"AIdestination",
        
    };

    storageMap: Map<string, DataStorage> = new Map<string, DataStorage>();

    constructor() {
        super();
    }

    Init() {
        this.PlayerReadyAI = 0;
        this.isReadyAI = false;
        this.TickIndex = 0;
        this.leftPlayerNum = 1;
        this.StartPlayerNum =1;
        this.state.players.forEach((p:Player)=> {p.isDie = false});
    }

    onCreate(options: SandboxOptions) {
        // Room 객체가 생성될 때 호출됩니다.
        // Room 객체의 상태나 데이터 초기화를 처리 한다.
        this.Init();/**Zepeto Player Sync**/
        this.onMessage(MESSAGE.SyncPlayer, (client, message) => {
            const player = this.state.players.get(client.sessionId);
            /** State **/
                //animation param
            const animationParam = new ZepetoAnimationParam();
            animationParam.State = message.animationParam.State;
            animationParam.MoveState = message.animationParam.MoveState;
            animationParam.JumpState = message.animationParam.JumpState;
            animationParam.LandingState = message.animationParam.LandingState;
            animationParam.MotionSpeed = message.animationParam.MotionSpeed;
            animationParam.FallSpeed = message.animationParam.FallSpeed;
            animationParam.Acceleration = message.animationParam.Acceleration;
            animationParam.MoveProgress = message.animationParam.MoveProgress;
            player.animationParam = animationParam;

            player.gestureName = message.gestureName; // Gesture Sync

            //additional Value
            if(message.playerAdditionalValue != null) {
                const pAdditionalValue = new PlayerAdditionalValue();
                pAdditionalValue.additionalWalkSpeed = message.playerAdditionalValue.additionalWalkSpeed;
                pAdditionalValue.additionalRunSpeed = message.playerAdditionalValue.additionalRunSpeed;
                pAdditionalValue.additionalJumpPower = message.playerAdditionalValue.additionalJumpPower;
                player.playerAdditionalValue = pAdditionalValue;
            }
        });

        /**Transform Sync**/
        this.onMessage(MESSAGE.SyncTransform, (client, message) => {
            if (!this.state.SyncTransforms.has(message.Id)) {
                const syncTransform = new SyncTransform();
                this.state.SyncTransforms.set(message.Id.toString(), syncTransform);
            }
            const syncTransform:SyncTransform = this.state.SyncTransforms.get(message.Id);
            syncTransform.Id = message.Id;
            syncTransform.position = new sVector3();
            syncTransform.position.x = message.position.x;
            syncTransform.position.y = message.position.y;
            syncTransform.position.z = message.position.z;

            syncTransform.localPosition = new sVector3();
            syncTransform.localPosition.x = message.localPosition.x;
            syncTransform.localPosition.y = message.localPosition.y;
            syncTransform.localPosition.z = message.localPosition.z;

            syncTransform.rotation = new sQuaternion();
            syncTransform.rotation.x = message.rotation.x;
            syncTransform.rotation.y = message.rotation.y;
            syncTransform.rotation.z = message.rotation.z;
            syncTransform.rotation.w = message.rotation.w;

            syncTransform.scale = new sVector3();
            syncTransform.scale.x = message.scale.x;
            syncTransform.scale.y = message.scale.y;
            syncTransform.scale.z = message.scale.z;

            syncTransform.sendTime = message.sendTime;
        });
        this.onMessage(MESSAGE.SyncTransformStatus, (client, message) => {
            const syncTransform:SyncTransform = this.state.SyncTransforms.get(message.Id);
            syncTransform.status = message.Status;
        });

        this.onMessage(MESSAGE.ChangeOwner, (client,message:string) => {
            this.broadcast(MESSAGE.ChangeOwner+message, client.sessionId);
        });
        this.onMessage(MESSAGE.Instantiate, (client,message:InstantiateObj) => {
            const InstantiateObj: InstantiateObj = {
                Id: message.Id,
                prefabName: message.prefabName,
                ownerSessionId: message.ownerSessionId,
                spawnPosition: message.spawnPosition,
                spawnRotation: message.spawnRotation,
            };
            this.InstantiateObjCaches.push(InstantiateObj);
            this.broadcast(MESSAGE.Instantiate, InstantiateObj);
        });
        this.onMessage(MESSAGE.RequestInstantiateCache, (client) => {
            this.InstantiateObjCaches.forEach((obj)=>{
                client.send(MESSAGE.Instantiate, obj);
            });
        });

        /**SyncDOTween**/
        this.onMessage(MESSAGE.SyncDOTween, (client, message: syncTween) => {
            const tween: syncTween = {
                Id: message.Id,
                position: message.position,
                nextIndex: message.nextIndex,
                loopCount: message.loopCount,
                sendTime: message.sendTime,
            };
            this.broadcast(MESSAGE.ResponsePosition + message.Id, tween, {except: this.masterClient()});
        });

        /**Common**/
        this.onMessage(MESSAGE.CheckServerTimeRequest, (client, message) => {
            let Timestamp = +new Date();
            client.send(MESSAGE.CheckServerTimeResponse, Timestamp);
        });
        this.onMessage(MESSAGE.CheckMaster, (client, message) => {
            console.log(`master->, ${this.sessionIdQueue[0]}`);
            this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
        });
        this.onMessage(MESSAGE.PauseUser, (client) => {
            if(this.sessionIdQueue.includes(client.sessionId)) {
                const pausePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
                this.sessionIdQueue.splice(pausePlayerIndex, 1);

                if (pausePlayerIndex == 0) {
                    console.log(`master->, ${this.sessionIdQueue[0]}`);
                    this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
                }
            }
        });
        this.onMessage(MESSAGE.UnPauseUser, (client) => {
            if(!this.sessionIdQueue.includes(client.sessionId)) {
                this.sessionIdQueue.push(client.sessionId);
                this.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        });

        /** Sample Code **/
        this.onMessage(MESSAGE.BlockEnter, (client,transformId:string) => {
            this.broadcast(MESSAGE.BlockEnter+transformId, client.sessionId);
        });
        this.onMessage(MESSAGE.BlockExit, (client,transformId:string) => {
            this.broadcast(MESSAGE.BlockExit+transformId, client.sessionId);
        });
        this.onMessage(MESSAGE.SendBlockEnterCache, (client,blockCache) => {
            this.loadPlayer(blockCache.newJoinSessionId)?.send(MESSAGE.BlockEnter+blockCache.transformId, client.sessionId);
        });

        this.onMessage(MESSAGE.CoinAcquired, (client,transformId:string) => {
            this.masterClient()?.send(MESSAGE.CoinAcquired+transformId, client.sessionId);
        });

        /** Racing Game **/
        let isStartGame:boolean = false;
        let startServerTime:number;
        this.onMessage(MESSAGE.StartRunningRequest, (client) => {
            if(!isStartGame) {
                isStartGame = true;
                startServerTime = +new Date();

                this.broadcast(MESSAGE.CountDownStart, startServerTime);
            }
        });
        this.onMessage(MESSAGE.FinishPlayer, (client,finishTime:number) => {
            let playerLapTime = (finishTime-startServerTime)/1000;
            console.log(`${client.sessionId}is enter! ${playerLapTime}`);
            const gameReport: GameReport = {
                playerUserId: client.userId,
                playerLapTime: playerLapTime,
            };
            this.broadcast(MESSAGE.ResponseGameReport, gameReport);
            if(isStartGame) {
                isStartGame = false;
                let gameEndTime:number = +new Date();
                this.broadcast(MESSAGE.FirstPlayerGetIn, gameEndTime);
            }
        });

        this.onMessage(this.MESSAGE_TYPE.OnPlayGesture, (client, message: number) => {
            let gestureInfo: PlayerGestureInfo = {
                sessionId: client.sessionId,
                gestureIndex: message
            };
            this.broadcast(this.MESSAGE_TYPE.OnPlayGesture, gestureInfo);
        });

        this.onMessage(this.MESSAGE_TYPE.OnKillPlayer, (client, message) => {
            let killInfo: PlayerKillInfo = {
                attackerSessionId: message.attackerSessionId,
                attackerNickname: message.attackerNickname,
                victimSessionId: message.victimSessionId,
                victimNickname: message.victimNickname,
                victimTag: message.victimTag
            };            
            this.broadcast(this.MESSAGE_TYPE.OnKillPlayer, killInfo);
            if (killInfo.victimTag == "Player") {
                this.state.players.get(killInfo.victimSessionId).isDie = true;
                this.leftPlayerNum--;
                this.broadcast(this.MESSAGE_TYPE.LeftPlayer, this.leftPlayerNum);
                if (this.leftPlayerNum == 1 && this.StartPlayerNum != 1) {
                    this.broadcast(this.MESSAGE_TYPE.OnEndGame, client.userId);                        
                    this.ReGame();
                }
            }
        });


        /** AIManager **/
        this.onMessage(this.MESSAGE_TYPE.ReadyAI, (client, message) => {
            this.PlayerReadyAI++;
            console.log(client.sessionId + "is Ready");
            if (this.PlayerReadyAI == this.sessionIdQueue.length)
                this.isReadyAI = true;
        });

        /** Common **/
        this.onMessage(this.MESSAGE_TYPE.CheckMaster, (client, message) => {
            if (this.masterClientSessionId != this.sessionIdQueue[0]) {
                this.masterClientSessionId = this.sessionIdQueue[0];
                console.log("master->", this.masterClientSessionId);
            }
            this.broadcast(this.MESSAGE_TYPE.CheckMaster, this.masterClientSessionId);
        });

        /** GameStartPanel **/
        this.onMessage(this.MESSAGE_TYPE.ReceiveAllPlayer, (client, message) => {
            let usersID: string[] = [];
            for (let i = 0; i < this.sessionIdQueue.length; i++) {
                usersID.push(this.state.players.get(this.sessionIdQueue[i]).zepetoUserId);
            }
            this.broadcast(this.MESSAGE_TYPE.ReceiveAllPlayer, usersID);
            //this.broadcast("ReceiveAllPlayer", this.state.players.get(this.sessionIdQueue[0]).zepetoUserId);
        });
        this.onMessage(this.MESSAGE_TYPE.GameStart, async (client, message: number) => {
            this.broadcast(this.MESSAGE_TYPE.GameStart, message);
            this.NumberOfAI = message;
            this.StartPlayerNum = this.sessionIdQueue.length;
            this.leftPlayerNum = this.sessionIdQueue.length;
            this.broadcast(this.MESSAGE_TYPE.LeftPlayer, this.leftPlayerNum);
            this.SyncAllTransform();
            await this.lock();
        });
        this.onMessage(this.MESSAGE_TYPE.ChangeNumberOfAI, (client, message: number) => {
            this.broadcast(this.MESSAGE_TYPE.ChangeNumberOfAI, message);
        });

        /** TEST **/
        this.onMessage("Debug", (client, message) => {
            console.log("debug by " + client.sessionId);
            this.broadcast("Debug", message);
        });
    }


    async onJoin(client: SandboxPlayer) {
        // schemas.json 에서 정의한 player 객체를 생성 후 초기값 설정.
        console.log(`[OnJoin] sessionId : ${client.sessionId}, HashCode : ${client.hashCode}, userId : ${client.userId}`)
        this.sessionIdQueue.push(client.sessionId.toString());
        if (this.masterClientSessionId != this.sessionIdQueue[0]) {
            this.masterClientSessionId = this.sessionIdQueue[0];
            console.log("master->", this.masterClientSessionId)
        }
        const player = new Player();
        player.sessionId = client.sessionId;

        if (client.hashCode) {
            player.zepetoHash = client.hashCode;
        }
        if (client.userId) {
            player.zepetoUserId = client.userId;
        }
        player.isDie = false;
        player.isMasterClient = false;
        
        // [DataStorage] 입장한 Player의 DataStorage Load
        const storage: DataStorage = client.loadDataStorage();

        this.storageMap.set(client.sessionId, storage);

        let visit_cnt = await storage.get("VisitCount") as number;
        if (visit_cnt == null) visit_cnt = 0;

        console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visit_cnt}`)

        // [DataStorage] Player의 방문 횟수를 갱신한다음 Storage Save
        await storage.set("VisitCount", ++visit_cnt);

        // client 객체의 고유 키값인 sessionId 를 사용해서 Player 객체를 관리.
        // set 으로 추가된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnAdd 이벤트를 추가하여 확인 할 수 있음.
        this.state.players.set(client.sessionId, player);
    }

    onTick(deltaTime: number): void {
        //  서버에서 설정된 타임마다 반복적으로 호출되며 deltaTime 을 이용하여 일정한 interval 이벤트를 관리할 수 있음.
        //console.log(deltaTime);

        if (this.isReadyAI) {
            this.TickIndex++;
            if (this.TickIndex > (50 / this.NumberOfAI)) {
                let AIdestination: AIdestination = {
                    AInumber: this.RandInt(0, this.NumberOfAI),
                    Stop: this.RandInt(0, 3) == 0 ? true : false,
                    nexPosX: this.Rand(-25, 25),
                    nexPosZ: this.Rand(-25, 25),
                };
                //타겟 프로퍼티 추가
                this.broadcast(this.MESSAGE_TYPE.AIdestination, AIdestination);
                this.TickIndex = 0;
            }
        }
    }

    async onLeave(client: SandboxPlayer, consented?: boolean) {
        console.log(client.sessionId+"leave");
        this.sessionIdQueue.splice((this.sessionIdQueue.indexOf(client.sessionId)), 1);
        
        this.masterClientSessionId = this.sessionIdQueue[0];
        this.broadcast("CheckMaster", this.masterClientSessionId);
        console.log("master->", this.masterClientSessionId);

        let usersID: string[] = [];
        for (let i = 0; i < this.sessionIdQueue.length; i++) {
            usersID.push(this.state.players.get(this.sessionIdQueue[i]).zepetoUserId);
        }
        this.broadcast(this.MESSAGE_TYPE.ReceiveAllPlayer, usersID);

        
        // 살아있는 사람이면
        const player = this.state.players.get(client.sessionId);
        if(!player.isDie){
            this.leftPlayerNum --;
            this.broadcast(this.MESSAGE_TYPE.LeftPlayer, this.leftPlayerNum);
        }
        // allowReconnection 설정을 통해 순단에 대한 connection 유지 처리등을 할 수 있으나 기본 가이드에서는 즉시 정리.
        // delete 된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnRemove 이벤트를 추가하여 확인 할 수 있음.
        this.state.players.delete(client.sessionId);
    }
    
    SyncAllTransform(){
        let AItransforms: SpawnSyncTransform[] = [];
        for (let i = 0; i < this.NumberOfAI; i++) {
            let AItransform: SpawnSyncTransform = {
                SessionId:"AI_"+i.toString(),
                PosX: this.Rand(-25, 25),
                PosZ: this.Rand(-25, 25),
                RotY: Math.random() * 360 - 180,
            };
            AItransforms.push(AItransform);
        }
        this.broadcast(this.MESSAGE_TYPE.FirstSyncAI, AItransforms);

        let Playertransforms: SpawnSyncTransform[] = [];
        for (let i = 0; i < this.sessionIdQueue.length; i++) {
            let Playertransform: SpawnSyncTransform = {
                SessionId:this.sessionIdQueue[i],
                PosX: this.Rand(-25, 25),
                PosZ: this.Rand(-25, 25),
                RotY: Math.random() * 360 - 180,
            };
            Playertransforms.push(Playertransform);
        }
        this.broadcast(this.MESSAGE_TYPE.FirstSyncPlayer, Playertransforms);
    }
    
    async ReGame() {
        await this.unlock();
        this.Init();
    }

    Rand(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    RandInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    
}

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: number,
}

interface PlayerKillInfo {
    attackerSessionId: string,
    attackerNickname: string,
    victimSessionId: string,
    victimNickname: string,
    victimTag: string
}

interface SpawnSyncTransform {
    SessionId: string,
    PosX: number,
    PosZ: number,
    RotY: number,
}

interface AIdestination {
    AInumber: number,
    Stop: boolean,
    nexPosX: number,
    nexPosZ: number,
}

interface syncTween {
    Id: string,
    position: sVector3,
    nextIndex: number,
    loopCount: number,
    sendTime: number,
}

interface InstantiateObj{
    Id:string;
    prefabName:string;
    ownerSessionId?:string;
    spawnPosition?:sVector3;
    spawnRotation?:sQuaternion;
}

/** racing game **/
interface GameReport{
    playerUserId : string;
    playerLapTime : number;
}

enum MESSAGE {
    SyncPlayer = "SyncPlayer",
    SyncTransform = "SyncTransform",
    SyncTransformStatus = "SyncTransformStatus",
    ChangeOwner = "ChangeOwner",
    Instantiate = "Instantiate",
    RequestInstantiateCache = "RequestInstantiateCache",
    ResponsePosition = "ResponsePosition",
    SyncDOTween = "SyncDOTween",
    CheckServerTimeRequest = "CheckServerTimeRequest",
    CheckServerTimeResponse = "CheckServerTimeResponse",
    CheckMaster = "CheckMaster",
    MasterResponse = "MasterResponse",
    PauseUser = "PauseUser",
    UnPauseUser = "UnPauseUser",

    /** Sample Code **/
    BlockEnter = "BlockEnter",
    BlockExit = "BlockExit",
    SendBlockEnterCache = "SendBlockEnterCache",
    CoinAcquired = "CoinAcquired",

    /** Racing Game **/
    StartRunningRequest = "StartRunningRequest",
    FinishPlayer = "FinishPlayer",
    FirstPlayerGetIn = "FirstPlayerGetIn",
    CountDownStart = "CountDownStart",
    ResponseGameReport = "ResponseGameReport"
}