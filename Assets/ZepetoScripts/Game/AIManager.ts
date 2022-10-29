import { GameObject, Quaternion, Random, Vector3, WaitForSeconds } from 'UnityEngine';
import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import ZepetoGameCharacter from './ZepetoGameCharacter';

export default class AIManager extends ZepetoScriptBehaviour {
    public _AICount: number = 10;

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    private room: Room;
    private isMasterClient: boolean = false;
    private AIGameObject: GameObject[];

    Start() {
        this._multiplay.RoomCreated += (room: Room) => {
            this.SpawnAI(this._AICount);
            this.room = room;

            this.room.Send("CheckMaster")

            this.room.AddMessageHandler("CheckMaster", (MasterClientSessionId) => {
                if (this.room.SessionId == MasterClientSessionId) {
                    //처음 마스터가 되면
                    if (!this.isMasterClient) {
                        this.isMasterClient = true;
                        this.StartCoroutine(this.SyncAIPosition(0.04));
                    }
                    //전체 AI동기화
                    //this.SendAIDestination();
                    console.log("ImMasterClient");
                }
            });

        }
    }
    //AI
    SpawnAI(required: number) {
        for (let i = 0; i < required; i++) {
            const spawnInfo = new SpawnInfo();
            const position = new Vector3(Random.Range(-25, 25), 0, Random.Range(-25, 25));
            const rotation = new Vector3(0, Random.Range(-180, 180), 0);
            spawnInfo.position = position;
            spawnInfo.rotation = Quaternion.Euler(rotation);
            ZepetoPlayers.instance.CreatePlayerWithUserId("AI_" + i.toString(), "", spawnInfo, false);
        }
    }
    InitAI(required: number) {
        for (let i = 0; i < required; i++) {
            const aiPlayer = ZepetoPlayers.instance.GetPlayer("AI_" + i.toString());
            this.AIGameObject[i] = aiPlayer.character.gameObject;
            aiPlayer.character.tag = "AI";
            aiPlayer.character.name = "AI_" + i.toString();
            aiPlayer.character.transform.gameObject.AddComponent<ZepetoGameCharacter>();
        }
    }

    *SyncAIPosition(tick: number) {
        for (let i = 0; i < this._AICount; i++) {

            this.SendAIDestination(i);
        }

        yield new WaitForSeconds(tick);
    }
    SendAIDestination(AInumber: number) {
        const nowX = this.AIGameObject[AInumber].transform.localPosition.x;
        const nowY = this.AIGameObject[AInumber].transform.localPosition.x;
        const nowZ = this.AIGameObject[AInumber].transform.localPosition.x;
        const nextX = nowX + Random.Range(-25, 25);
        const nextY = nowY + Random.Range(-25, 25);

        const data = new RoomData();
        data.Add("AInumber", AInumber);

        const pos = new RoomData();
        pos.Add("x", nowX );
        pos.Add("y", nowY);
        pos.Add("z", nowZ);
        data.Add("position", pos.GetObject());

        const destination = new RoomData();
        destination.Add("x", nextX);
        destination.Add("y", nextY);
        destination.Add("z", 0);
        data.Add("destination", destination.GetObject());
        this.room.Send("AIdestination", data.GetObject());
    }
}