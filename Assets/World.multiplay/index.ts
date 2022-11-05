import {Sandbox, SandboxOptions, SandboxPlayer} from "ZEPETO.Multiplay";
import {DataStorage} from "ZEPETO.Multiplay.DataStorage";
import {Player, Transform, Vector3} from "ZEPETO.Multiplay.Schema";

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: number,
}

interface PlayerKillInfo {
    attackerSessionId: string,
    attackerNickname: string,
    victimSessionId: string,
    victimNickname: string,
    victimTag:string
}

interface AItransform {
    AInumber: number,
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

export default class extends Sandbox {
    private sessionIdQueue: string[] = [];
    private masterClientSessionId: string;
    private NumberOfAI: number = 10;
    private PlayerReadyAI: number = 0;
    private isReadyAI: boolean = false;
    private TickIndex: number = 0;
    private leftPlayerNum:number =1;
    private StartPlayerNum:number =1;

    MESSAGE_TYPE = {
        OnPlayGesture: "OnPlayGesture",
        OnHitPlayer: "OnHitPlayer",
        EndGame:"EndGame",
        
    };

    storageMap: Map<string, DataStorage> = new Map<string, DataStorage>();

    constructor() {
        super();
    }

    Init() {
        this.sessionIdQueue = [];
        this.masterClientSessionId = "";
        this.NumberOfAI = 10;
        this.PlayerReadyAI = 0;
        this.isReadyAI = false;
        this.TickIndex = 0;
    }

    onCreate(options: SandboxOptions) {
        // Room 객체가 생성될 때 호출됩니다.
        // Room 객체의 상태나 데이터 초기화를 처리 한다.
        this.Init();
        /** GameManager **/
        this.onMessage("onChangedTransform", (client, message) => {
            const player = this.state.players.get(client.sessionId);

            const transform = new Transform();
            transform.position = new Vector3();
            transform.position.x = message.position.x;
            transform.position.y = message.position.y;
            transform.position.z = message.position.z;

            transform.rotation = new Vector3();
            transform.rotation.x = message.rotation.x;
            transform.rotation.y = message.rotation.y;
            transform.rotation.z = message.rotation.z;

            player.transform = transform;
        });

        this.onMessage("onChangedState", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            player.state = message.state;
            player.subState = message.subState; // Character Controller V2
        });

        this.onMessage(this.MESSAGE_TYPE.OnPlayGesture, (client, message: number) => {
            let gestureInfo: PlayerGestureInfo = {
                sessionId: client.sessionId,
                gestureIndex: message
            };
            this.broadcast(this.MESSAGE_TYPE.OnPlayGesture, gestureInfo);
        });

        this.onMessage(this.MESSAGE_TYPE.OnHitPlayer, (client, message) => {
            let killInfo: PlayerKillInfo = {
                attackerSessionId: message.attackerSessionId,
                attackerNickname: message.attackerNickname,
                victimSessionId: message.victimSessionId,
                victimNickname: message.victimNickname,
                victimTag :message.victimTag
            };
            if(killInfo.victimTag == "Player"){
                this.leftPlayerNum--;
                if(this.leftPlayerNum==1 && this.StartPlayerNum!=1){
                    this.broadcast("EndGame", client.userId);
                }
            }
            this.broadcast(this.MESSAGE_TYPE.OnHitPlayer, killInfo);
        });
        //EndGame => 다 죽을시 우승자 판넬 오픈
        this.onMessage(this.MESSAGE_TYPE.EndGame, async (client, message) => {
            this.broadcast("EndGame", client.userId);
        });

        //ReGame => 다음버튼 누를 시 로비로 이동
        this.onMessage(this.MESSAGE_TYPE.EndGame, async (client, message) => {
            this.broadcast("EndGame", client.userId);            
            this.ReGame();
            await this.unlock();
        });


        /** AIManager **/
        this.onMessage("FirstSyncAI", (client, message: number) => {
            this.NumberOfAI = message;
            let AItransforms: AItransform[] = [];
            for (let i = 0; i < this.NumberOfAI; i++) {
                let AItransform: AItransform = {
                    AInumber: i,
                    PosX: this.Rand(-25, 25),
                    PosZ: this.Rand(-25, 25),
                    RotY: Math.random() * 360 - 180,
                };
                AItransforms.push(AItransform);
            }
            this.broadcast("FirstSyncAI", AItransforms);
        });
        this.onMessage("ReadyAI", (client, message) => {
            this.PlayerReadyAI++;
            console.log(client.sessionId + "is Ready");
            if (this.PlayerReadyAI == this.sessionIdQueue.length)
                this.isReadyAI = true;
        });

        /** Common **/
        this.onMessage("CheckMaster", (client, message) => {
            if (this.masterClientSessionId != this.sessionIdQueue[0]) {
                this.masterClientSessionId = this.sessionIdQueue[0];
                console.log("master->", this.masterClientSessionId)
            }
            this.broadcast("CheckMaster", this.masterClientSessionId);
        });

        /** GameStartPanel **/
        this.onMessage("ReceiveAllPlayer", (client, message) => {
            let usersID: string[] = [];
            for (let i = 0; i < this.sessionIdQueue.length; i++) {
                usersID.push(this.state.players.get(this.sessionIdQueue[i]).zepetoUserId);
            }
            this.broadcast("ReceiveAllPlayer", usersID);
            //this.broadcast("ReceiveAllPlayer", this.state.players.get(this.sessionIdQueue[0]).zepetoUserId);
        });
        this.onMessage("GameStart", async (client, message: number) => {
            this.broadcast("GameStart", message);
            this.StartPlayerNum == this.sessionIdQueue.length;
            this.leftPlayerNum == this.sessionIdQueue.length;
            await this.lock();
        });
        this.onMessage("ChangeNumberOfAI", (client, message: number) => {
            this.broadcast("ChangeNumberOfAI", message);
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
                this.broadcast("AIdestination", AIdestination);
                this.TickIndex = 0;
            }
        }
    }

    async onLeave(client: SandboxPlayer, consented?: boolean) {
        this.sessionIdQueue.splice((this.sessionIdQueue.indexOf(client.sessionId)), 1)
        if (this.masterClientSessionId != this.sessionIdQueue[0]) {
            this.masterClientSessionId = this.sessionIdQueue[0];
            this.broadcast("CheckMaster", this.masterClientSessionId);
            console.log("master->", this.masterClientSessionId)

            let usersID: string[] = [];
            for (let i = 0; i < this.sessionIdQueue.length; i++) {
                usersID.push(this.state.players.get(this.sessionIdQueue[i]).zepetoUserId);
            }
            this.broadcast("ReceiveAllPlayer", usersID);
        }
        // 살아있는 사람이면
        //this.leftPlayerNum --;
        
        // allowReconnection 설정을 통해 순단에 대한 connection 유지 처리등을 할 수 있으나 기본 가이드에서는 즉시 정리.
        // delete 된 player 객체에 대한 정보를 클라이언트에서는 players 객체에 add_OnRemove 이벤트를 추가하여 확인 할 수 있음.
        this.state.players.delete(client.sessionId);
    }
    
    ReGame(){
        this.Init();
    }
    Rand(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    RandInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}