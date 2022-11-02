import { AnimationClip, GameObject, Quaternion, Random, SpriteRenderer, Texture2D, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { LocalPlayer, SpawnInfo, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import ZepetoGameCharacter from './ZepetoGameCharacter';

interface PlayerGestureInfo {
    sessionId: string,
    gestureIndex: MotionIndex,
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

    private _myCharacter: ZepetoCharacter;
    private _punchCool: number = 5;
    private _punchFlag: boolean;
    private _punchBtn: Button;
    private room: Room;

    private _MESSAGE = {
        OnPunchGesture: "OnPunchGesture",
        OnHitPlayer: "OnHitPlayer"
    };

    Start() {
        this._multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._myCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
            this._punchBtn = GameObject.Find("PunchBtn").GetComponent<Button>() as Button;
            this._punchBtn.onClick.AddListener(() => {
                this.Punch();
            });
            //�����κ��� ������ ������ ������ ����
            this.room.AddMessageHandler(this._MESSAGE.OnPunchGesture, (message: PlayerGestureInfo) => {
                this.StartCoroutine(this.GestureSync(message));
            });
            this.room.AddMessageHandler(this._MESSAGE.OnHitPlayer, (message: PlayerKillInfo) => {
                this.KillLog(message);
            });
        });

    }

    Punch() {
        if (!this._punchFlag) {
            this._punchFlag = true;
            this.room.Send(this._MESSAGE.OnPunchGesture, MotionIndex.Punch);
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

    
    ParseVector3(vector3: Vector3): Vector3 {
        return new Vector3
            (
                vector3.x,
                vector3.y,
                vector3.z
            );
    }

    /*TODO
    - transform���� ���Ǿ��̵� �������¹�
    - ai ����ȭ ��ǥ�� ai �̵�

    BUGS
    - ��ġ �ִϸ��̼� �κ�ũ ����
    - AI�߰��ɶ� �������� �ذ�
    - SetGesture ���� (��� ��� ����)
    */
}