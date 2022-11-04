import {GameObject, Transform, Quaternion, Random, Vector3, WaitForSeconds, WaitUntil} from 'UnityEngine';
import {CharacterState, SpawnInfo, ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {Room, RoomData} from 'ZEPETO.Multiplay';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World';
import ZepetoGameCharacter from './ZepetoGameCharacter';


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
    nexPosZ: number
}

export default class AIManager extends ZepetoScriptBehaviour {
    public _AICount: number;

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    private room: Room;
    private isMasterClient: boolean;
    @SerializeField() private AICharacters: ZepetoCharacter[] = [];


    Start() {
        this.Init();
        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        }
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room.AddMessageHandler("CheckMaster", (MasterClientSessionId) => {
                if (this.room.SessionId == MasterClientSessionId) {
                    if (!this.isMasterClient) {
                        this.isMasterClient = true;
                    }
                } else {

                }
            });
            this.room.AddMessageHandler("GameStart", (message: number) => {
                this._AICount = message;
                if (this.isMasterClient)
                    this.room.Send("FirstSyncAI", this._AICount);
                this.room.AddMessageHandler("FirstSyncAI", (message: AItransform[]) => {
                    this.StartCoroutine(this.SpawnAI(message));
                });
            });
            this.room.AddMessageHandler("AIdestination", (message: AIdestination) => {
                if (this.AICharacters[message.AInumber]?.CurrentState == CharacterState.Idle)
                    this.StartCoroutine(this.MoveAI(message.AInumber, message));
            });
        });
    }

    Init() {
        this._AICount = 10;
        this.isMasterClient = false;
    }

    * SpawnAI(receiveAI: AItransform[]) {
        for (let i = 0; i < receiveAI.length; i++) {
            const spawnInfo = new SpawnInfo();
            const position = new Vector3(receiveAI[i].PosX, 0, receiveAI[i].PosZ);
            const rotation = new Vector3(0, receiveAI[i].RotY, 0);
            spawnInfo.position = position;
            spawnInfo.rotation = Quaternion.Euler(rotation);
            ZepetoPlayers.instance.CreatePlayerWithUserId("AI_" + i.toString(), "", spawnInfo, false);
        }
        yield new WaitUntil(()=> ZepetoPlayers.instance.HasPlayer("AI_" + (receiveAI.length-1).toString()));
        for (let i = 0; i < receiveAI.length; i++) {
            const aiPlayer = ZepetoPlayers.instance.GetPlayer("AI_" + i.toString());
            this.AICharacters.push(aiPlayer.character);
            this.AICharacters[i].tag = "AI";
            this.AICharacters[i].name = "AI_" + i.toString();
            let zepetoGameCharacter = this.AICharacters[i].transform.gameObject.AddComponent<ZepetoGameCharacter>();
            zepetoGameCharacter.sessionID = "AI_" + i.toString();
        }
        //ready AI Send
        this.room.Send("ReadyAI");
    }

    * MoveAI(i: number, AIdestination: AIdestination) {
        if (AIdestination.Stop) {
            this.AICharacters[i].StopMoving();
        } else {
            let StopSign = false;
            while (!StopSign) {
                const newposition = new Vector3(AIdestination.nexPosX, 0, AIdestination.nexPosZ);
                var moveDir = Vector3.op_Subtraction(newposition, this.AICharacters[i].transform.position);
                moveDir = new Vector3(moveDir.x, 0, moveDir.z);
                if (moveDir.magnitude < 0.05) {
                    this.AICharacters[i].StopMoving();
                    StopSign = true;
                } else {
                    this.AICharacters[i].MoveContinuously(moveDir);
                }
                yield new WaitForSeconds(0.1);
            }
        }
        yield null;
    }

    SendAIDestination(AInumber: number) {
        const nowX = this.AICharacters[AInumber].transform.localPosition.x;
        const nowY = this.AICharacters[AInumber].transform.localPosition.x;
        const nowZ = this.AICharacters[AInumber].transform.localPosition.x;
        const nextX = nowX + Random.Range(-25, 25);
        const nextY = nowY + Random.Range(-25, 25);

        const data = new RoomData();
        data.Add("AInumber", AInumber);

        const nowPos = new RoomData();
        nowPos.Add("x", nowX);
        nowPos.Add("y", nowY);
        nowPos.Add("z", nowZ);
        data.Add("nowPos", nowPos.GetObject());

        const nexPos = new RoomData();
        nexPos.Add("x", nextX);
        nexPos.Add("y", nextY);
        nexPos.Add("z", 0);
        data.Add("nexPos", nexPos.GetObject());
        this.room.Send("AIdestination", data.GetObject());
    }

    private

    ParseVector3(vector3: Vector3):
        Vector3 {
        return new Vector3(vector3.x, vector3.y, vector3.z);
    }

}