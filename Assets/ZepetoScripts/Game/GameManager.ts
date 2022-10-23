import { AnimationClip, GameObject, Quaternion, Random, SpriteRenderer, Texture2D, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import ZepetoGameCharacter from './ZepetoGameCharacter';

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
    "Defense",
    "Die"
}

export default class GameManager extends ZepetoScriptBehaviour {

    @SerializeField() private _multiplay: ZepetoWorldMultiplay;
    @SerializeField() private _punchGesture: AnimationClip;
    @SerializeField() private _defenseGesture: AnimationClip;
    @SerializeField() private _dieGesture: AnimationClip;
    @SerializeField() private _punchBtn: Button;

    private _myCharacter: ZepetoCharacter;
    private _punchCool: number = 5;
    private _AICount: number = 10;
    private _punchFlag: boolean;
    private room: Room;

    private _MESSAGE = {
        OnPunchGesture: "OnPunchGesture",
        OnHitPlayer: "OnHitPlayer"
    };

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this._punchBtn = GameObject.Find("PunchBtn").GetComponent<Button>() as Button;
            this._punchBtn.onClick.AddListener(() => {
                this.Punch();
            });
            //서버로부터 유저의 제스쳐 정보를 받음
            this.room.AddMessageHandler(this._MESSAGE.OnPunchGesture, (message: PlayerGestureInfo) => {
                this.StartCoroutine(this.GestureSync(message));
            });
            this.room.AddMessageHandler(this._MESSAGE.OnHitPlayer, (message: PlayerKillInfo) => {
                this.KillLog(message);
            });
            this.InitAI(this._AICount);
        });

        this._multiplay.RoomCreated += (room: Room) => {
            this.SpawnAI(this._AICount);
            this.room = room;
        };
    }

    Punch() {
        if (!this._punchFlag) {
            this._punchFlag = true;
            const data = new RoomData();
            data.Add("gestureIndex", MotionIndex.Punch);
            this.room.Send(this._MESSAGE.OnPunchGesture, data.GetObject());
            this.StartCoroutine(this.punchCoolTime(this._punchCool));
        }
    }

    Kill(attacker: Transform, victim: Transform) {
        const data = new RoomData();
        data.Add("attackerSessionId", attacker.name);
        data.Add("victimSessionId", victim.name);
        this.room.Send(this._MESSAGE.OnHitPlayer, data.GetObject());
    }

    * GestureSync(playerGestureInfo: PlayerGestureInfo) {
        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(playerGestureInfo.sessionId);
        if (playerGestureInfo.gestureIndex == MotionIndex.Punch) {
            zepetoPlayer.character.SetGesture(this._punchGesture);
        }
        else if (playerGestureInfo.gestureIndex == MotionIndex.Die) {
            zepetoPlayer.character.SetGesture(this._dieGesture);
        }
        yield new WaitForSeconds(2);
        zepetoPlayer.character.CancelGesture();
    }

    * punchCoolTime(waitPunchCool : number) {
        yield new WaitForSeconds(waitPunchCool);
        this._punchFlag = false;
    }

    KillLog(playerKillInfo: PlayerKillInfo) {
        console.log(playerKillInfo.attackerSessionId + "Killed " + playerKillInfo.victimSessionId);

        let playerGestureInfo: PlayerGestureInfo;
        playerGestureInfo = { sessionId: playerKillInfo.victimSessionId, gestureIndex: MotionIndex.Die};

        console.log(playerGestureInfo);
        this.StartCoroutine(this.GestureSync(playerGestureInfo));
    }

    //AI
    SpawnAI(required: number) {
        for (let i = 0; i < required; i++) {
            const spawnInfo = new SpawnInfo();
            const position = this.ParseVector3(new Vector3(Random.Range(-25, 25), 0, Random.Range(-25, 25)));
            const rotation = this.ParseVector3(new Vector3(0, Random.Range(-180, 180), 0));
            spawnInfo.position = position;
            spawnInfo.rotation = Quaternion.Euler(rotation);
            ZepetoPlayers.instance.CreatePlayerWithUserId("AI_" + i.toString(), "", spawnInfo, false);
        }
    }
    InitAI(required: number) {
        for (let i = 0; i < required; i++) {
            const aiPlayer = ZepetoPlayers.instance.GetPlayer("AI_" + i.toString());
            aiPlayer.character.tag = "AI";
            aiPlayer.character.name = "AI_" + i.toString();
            aiPlayer.character.transform.gameObject.AddComponent<ZepetoGameCharacter>();
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

    /*TODO
    - transform에서 세션아이디 가져오는법
    - ai 동기화 좌표로 ai 이동

    BUGS
    - 펀치 애니메이션 인보크 오류
    - AI추가될때 오류구문 해결
    - SetGesture 오류 (모든 모션 동일)
    */
}