import {GameObject, Quaternion, Random, Vector3, WaitForSeconds} from 'UnityEngine';
import {SpawnInfo, ZepetoPlayers} from 'ZEPETO.Character.Controller';
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
    nowPos: Vector3,
    nexPos: Vector3
}

export default class AIManager extends ZepetoScriptBehaviour {
    public _AICount: number = 10;

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    private room: Room;
    private isMasterClient: boolean = false;
    private AIGameObject: GameObject[] = Array.from({length: this._AICount}, obj => null);


    Start() {
        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        }

        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room.AddMessageHandler("CheckMaster", (MasterClientSessionId) => {
                if (this.room.SessionId == MasterClientSessionId) {
                    if (!this.isMasterClient) {
                        this.isMasterClient = true;
                        //this.StartCoroutine(this.SyncAIPosition(0.04));
                    }
                    //��ü AI����ȭ(�ٸ� �÷��̾� ����)
                    //this.SendAIDestination();
                    for (let i = 0; i < this._AICount; i++) {
                        //this.SendAIDestination(i);
                    }
                    console.log("ImMasterClient");
                } else {

                }
            });
            this.room.AddMessageHandler("AIdestination", (message: AIdestination) => {
                this.AIGameObject[message.AInumber].transform.position = this.ParseVector3(message.nowPos);
            });
            this.room.AddMessageHandler("GameStart", (message: number) => {
                this._AICount = message;
                if (this.isMasterClient)
                    this.room.Send("FirstSyncAI", this._AICount);
                this.room.AddMessageHandler("FirstSyncAI", (message: AItransform[]) => {
                    this.StartCoroutine(this.SpawnAI(message));
                });
            });
        });
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
        yield new WaitForSeconds(1);
        for (let i = 0; i < receiveAI.length; i++) {
            const aiPlayer = ZepetoPlayers.instance.GetPlayer("AI_" + i.toString());
            this.AIGameObject[i] = aiPlayer.character.gameObject;
            aiPlayer.character.tag = "AI";
            aiPlayer.character.name = "AI_" + i.toString();
            let zepetoGameCharacter = aiPlayer.character.transform.gameObject.AddComponent<ZepetoGameCharacter>();               
            zepetoGameCharacter.sessionID = "AI_" + i.toString();
        }
    }

    * SyncAIPosition(tick: number) {
        while (true) {
            for (let i = 0; i < this._AICount; i++) {

                //this.SendAIDestination(i);
            }

            yield new WaitForSeconds(tick);
        }
    }

    SendAIDestination(AInumber: number) {
        const nowX = this.AIGameObject[AInumber].transform.localPosition.x;
        const nowY = this.AIGameObject[AInumber].transform.localPosition.x;
        const nowZ = this.AIGameObject[AInumber].transform.localPosition.x;
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

    private ParseVector3(vector3: Vector3): Vector3 {
        return new Vector3(vector3.x, vector3.y, vector3.z);
    }

}