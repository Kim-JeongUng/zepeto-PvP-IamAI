import {
    GameObject,
    Transform,
    Quaternion,
    Random,
    Vector3,
    WaitForSeconds,
    WaitUntil,
    AnimationClip,
    LayerMask
} from 'UnityEngine';
import {CharacterState, SpawnInfo, ZepetoCharacter, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import {Room, RoomData} from 'ZEPETO.Multiplay';
import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World';
import MultiplayManager from '../MultiplaySync/Common/MultiplayManager';
import ZepetoGameCharacter, { MotionState } from './ZepetoGameCharacter';

interface SyncTransform {
    SessionId: string,
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
    @SerializeField() private _dieGesture: AnimationClip;
    @SerializeField() private AICharacters: ZepetoCharacter[] = [];

    private room: Room;
    private isMasterClient: boolean;
    private _AICount: number = 0;

    private Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.room = MultiplayManager.instance.room;
            this.Init();
        });
    }

    private Init() {
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
        });
        this.room.AddMessageHandler("FirstSyncAI", (message: SyncTransform[]) => {
            this.StartCoroutine(this.SpawnAI(message));
        });
        this.room.AddMessageHandler("AIdestination", (message: AIdestination) => {
            if (this.AICharacters[message.AInumber]?.CurrentState == CharacterState.Idle
            && this.AICharacters[message.AInumber]?.GetComponent<ZepetoGameCharacter>().motionState==MotionState.Idle)
                this.StartCoroutine(this.MoveAI(message.AInumber, message));
        });
        this.room.AddMessageHandler("OnEndGame", (message) => {
            this.StopAllCoroutines();
            this.StartCoroutine(this.DestroyAllAI());
        });
    }

    private* SpawnAI(receiveAI: SyncTransform[]) {
        this.AICharacters = [];
        for (let i = 0; i < this._AICount; i++) {
            const spawnInfo = new SpawnInfo();
            const position = new Vector3(receiveAI[i].PosX, 0, receiveAI[i].PosZ);
            const rotation = new Vector3(0, receiveAI[i].RotY, 0);
            spawnInfo.position = position;
            spawnInfo.rotation = Quaternion.Euler(rotation);
            ZepetoPlayers.instance.CreatePlayerWithUserId(receiveAI[i].SessionId, "", spawnInfo, false);
        }
        for (let i = 0; i < this._AICount; i++) {
            yield new WaitUntil(() => ZepetoPlayers.instance.HasPlayer(receiveAI[i].SessionId));
            const aiPlayer = ZepetoPlayers.instance.GetPlayer(receiveAI[i].SessionId);
            this.AICharacters.push(aiPlayer.character);
            this.AICharacters[i].tag = "AI";
            this.AICharacters[i].name = receiveAI[i].SessionId;
            let zepetoGameCharacter = this.AICharacters[i].transform.gameObject.AddComponent<ZepetoGameCharacter>();
            zepetoGameCharacter.sessionID = receiveAI[i].SessionId;
        }
        //ready AI Send
        this.room.Send("ReadyAI");
    }

    private* MoveAI(i: number, AIdestination: AIdestination) {
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

    private* DestroyAllAI() {
        yield new WaitForSeconds(0.5);
        for (let i = 0; i < this._AICount; i++) {
            const zepetoPlayer = ZepetoPlayers.instance.GetPlayer("AI_" + i.toString());
            zepetoPlayer.character.SetGesture(this._dieGesture);
        }
        yield new WaitForSeconds(2.5);
        for (let i = 0; i < this._AICount; i++)
            ZepetoPlayers.instance.RemovePlayer("AI_" + i.toString());
    }

    private ParseVector3(vector3: Vector3): Vector3 {
        return new Vector3(vector3.x, vector3.y, vector3.z);
    }

}