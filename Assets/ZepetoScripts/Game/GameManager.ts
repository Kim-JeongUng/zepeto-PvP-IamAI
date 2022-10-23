import { AnimationClip, GameObject, Quaternion, Random, SpriteRenderer, Texture2D, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: number,
}
interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}

enum MotionIndex {
    "Punch" = 0,
    "Shield",
    "Die"
}

export default class GameManager extends ZepetoScriptBehaviour {

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    @SerializeField() private _punchGesture: AnimationClip;
    @SerializeField() private _punchBtn: Button;

    private _myCharacter: ZepetoCharacter;
    private _punchCoolTime: number = 5;
    private _punchFlag: boolean;
    private room: Room;

    MESSAGE = {
        OnPunchGesture: "OnPunchGesture",
        OnHitPlayer: "OnHitPlayer"
    };

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this._punchBtn = GameObject.Find("PunchBtn").GetComponent<Button>() as Button;
            this._punchBtn.onClick.AddListener(() => {
                console.log(this.MESSAGE.OnPunchGesture);
                this.Punch();
            });
            //서버로부터 유저의 제스쳐 정보를 받음
            this.room.AddMessageHandler(this.MESSAGE.OnPunchGesture, (message: PlayerGestureInfo) => {
                this.StartCoroutine(this.GestureSync(message));
            });
            this.room.AddMessageHandler(this.MESSAGE.OnHitPlayer, (message: PlayerKillInfo) => {
                this.KillLog(message);
            });
        });

        this._multiplay.RoomCreated += (room: Room) => {
            this.SpawnAI(10);
            this.room = room;

        };
    }

    Punch() {
        if (!this._punchFlag) {
            this._punchFlag = true;
            const data = new RoomData();
            data.Add("gestureIndex", MotionIndex.Punch);
            this.room.Send(this.MESSAGE.OnPunchGesture, data.GetObject());
            this.StartCoroutine(this.punchCoolTime(this._punchCoolTime));
        }
    }

    * GestureSync(playerGestureInfo: PlayerGestureInfo) {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId);
        if (playerGestureInfo.gestureIndex == MotionIndex.Punch) {
            zepetoPlayer.character.SetGesture(this._punchGesture);
        }
        yield new WaitForSeconds(2);
        zepetoPlayer.character.CancelGesture();
        if (this.room.SessionId == playerGestureInfo.sessionId)
            this._punchFlag;
    }

    * punchCoolTime(waitPunchCool : number) {
        yield new WaitForSeconds(waitPunchCool);
        this._punchFlag = false;
    }

    KillLog(playerKillInfo: PlayerKillInfo) {
        let playerGestureInfo: PlayerGestureInfo;
        playerGestureInfo.sessionId = playerKillInfo.victimSessionId;
        playerGestureInfo.gestureIndex = MotionIndex.Die;
        this.GestureSync(playerGestureInfo);
    }

    //AI Spawn
    SpawnAI(required: number) {
        for (let i = 0; i < required; i++) {
            const spawnInfo = new SpawnInfo();
            const position = this.ParseVector3(new Vector3(Random.Range(-25, 25), 0, Random.Range(-25, 25)));
            const rotation = this.ParseVector3(new Vector3(0, Random.Range(-180, 180), 0));
            spawnInfo.position = position;
            spawnInfo.rotation = Quaternion.Euler(rotation);
            ZepetoPlayers.instance.CreatePlayerWithUserId("ai" + i.toString(), "", spawnInfo, false);
        }
    }
    ParseVector3(vector3: Vector3): Vector3 {
        return new Vector3
            (
                vector3.x,
                vector3.y,
                vector3.z
            );
    }

}