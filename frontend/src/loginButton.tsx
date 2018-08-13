import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { resetDefaultFiles } from './store/userFiles/actions';
import * as React from 'react';
import { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import Typography from '@material-ui/core/Typography';
import { validateUser } from './utils/api/validateUser';
import { isFailureResponse } from './utils/api/apiHelpers';
import { getUserFiles } from './utils/api/getUserFiles';
import * as state from './state';

import Fade from '@material-ui/core/Fade';
import { GoogleLogin, } from 'react-google-login';
import Button from '@material-ui/core/Button';

import { GoogleLogout } from 'react-google-login';

const alternateLogoutButton = (onClickProp?: { onClick: () => void }) => {
    if (typeof onClickProp === 'undefined') {
        return (<Button color="inherit">Logout</Button>);
    }
    return (
        <Button color="inherit" onClick={onClickProp.onClick}>
            <Typography color="inherit" variant="button">Sign out</Typography>
        </Button>
    );
};

type GoogleLogoutButtonProps = {
    show: boolean, // whether to show it or not 
    onClick: () => void, // when they press log out button
};
/**
 * A GoogleLogoutButton (a stateless component)
 *
 * @param {GoogleLogoutButtonProps} props
 * @returns {JSX.Element} a Logout button
 */
function GoogleLogoutButton(props: GoogleLogoutButtonProps): JSX.Element {
    const { show } = props;
    return (
        <Fade in={show}>
            <div style={{ display: (show ? 'inline-block' : 'none') }}>
                <GoogleLogout
                    onLogoutSuccess={props.onClick}
                    render={alternateLogoutButton}
                />
            </div>
        </Fade>
    );
}

type LoginLogoutProps = {
    onLogout: () => void,
    setFiles: (userFiles: {name: string, content: string}[]) => void,
};

type LoginLogoutState = {
    loggedIn: boolean,
    loading: boolean,
    email: string
}

class LoginLogout extends React.Component<LoginLogoutProps, LoginLogoutState> {

    constructor(props: LoginLogoutProps) {
        super(props);
        this.state = {
            loggedIn: state.loggedIn.getValue(),
            loading: false,
            email: state.email.getValue()
        };
    }
    
    componentDidMount() {
        state.loggedIn.subscribe(x => this.setState({ loggedIn: x }));
        state.email.subscribe(x => this.setState({ email: x }));
    }

    onSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
        validateUser(response as GoogleLoginResponse).then((response) => {
            if (isFailureResponse(response)) {
                console.log(response.data.message)
                return;
            }
            state.loggedIn.next(true);
            state.email.next(response.data.email);
            state.filesLoading.next(true);
            this.loadFiles();

        }).catch(error => {
            console.log('Could not validate user', error);
        });
    }

    loadFiles = () => {
        getUserFiles().then(response => {
            if (isFailureResponse(response)) {
                console.log('Could not get files');
                return;
            }
            this.props.setFiles(response.data.userFiles);
        });
    }

    onFailure = (response: { error: string }) => {
        // this.props.onLogout(); // need a better way to have less logic in this module
        // there's way too much logic embedded for a presentational component
    }

    render() {
        const { loggedIn, email } = this.state;
        return (
            <div>
                <Typography style={{display: loggedIn ? "inline" : "none" }} variant="subheading" color="inherit">
                    {email}
                </Typography>
                <GoogleLogoutButton show={loggedIn} onClick={this.props.onLogout} />
                <GoogleLogin
                        style={{display: loggedIn ? "none" : "" }}
                        clientId="692270598994-p92ku4bbjkvcddouh578eb1a07s8mghc.apps.googleusercontent.com"
                        onSuccess={this.onSuccess}
                        onFailure={this.onFailure}
                        prompt="select_account" // always prompts user to select a specific account
                        isSignedIn
                    />
            </div >
        );
    }

}

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onLogout: () => { 
        dispatch(resetDefaultFiles());
        // Not sure if I should put this here
        localStorage.removeItem('userEmail');
        localStorage.removeItem('sessionId');
    }
});

export default connect(() => ({}), mapDispatchToProps)(LoginLogout);