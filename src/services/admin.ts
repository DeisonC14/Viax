import {getFunctions, httpsCallable} from "firebase/functions";
import {app} from "../lib/firebase";

const functions = getFunctions(app, "us-central1");

const setUserDisabledFn = httpsCallable(functions, "setUserDisabledV2");
const deleteUserFn = httpsCallable(functions, "deleteUserV2");

export async function blockUser(uid: string, disabled: boolean) {
  const res = await setUserDisabledFn({uid, disabled});
  return res.data as {ok: true; uid: string; disabled: boolean};
}

export async function removeUser(uid: string) {
  const res = await deleteUserFn({uid});
  return res.data as {ok: true; uid: string};
}
