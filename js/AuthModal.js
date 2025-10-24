export function Auth_Modaljs()
{
    const modal = document.querySelector('.modal');
    const backdrop = document.querySelector('.modal_backdrop');
    const closeBtn = document.querySelector('.modal_close');
    const switchLink = document.querySelectorAll('.switch-form');
    const loginForm = document.querySelector('.form-wrapper.login');
    const registerForm = document.querySelector('.form-wrapper.register');
    const forgotForm = document.querySelector('.form-wrapper.forgot');
    const primaryBtn = document.querySelectorAll('.btn.btn-primary');
    const registerFormEl = registerForm.querySelector('form');

    window.openLRFModal = function(target = 'login') {
        modal.classList.remove('hidden');
        [loginForm, registerForm, forgotForm].forEach(f => f.classList.remove('active'));
        if (target === 'register') registerForm.classList.add('active');
        else if (target === 'forgot') forgotForm.classList.add('active');
        else loginForm.classList.add('active');
    }

    function closeLRFModal() {
        modal.classList.add('hidden');
    }

    backdrop.addEventListener('click', closeLRFModal);
    closeBtn.addEventListener('click', closeLRFModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLRFModal() });

    switchLink.forEach(link => {
        link.addEventListener('click', () => {
            const text = link.textContent.trim();
            if (text.includes('Đăng kí ngay')) window.openLRFModal('register');
            else if (text.includes('Đăng nhập')) window.openLRFModal('login');
            else if (text.includes('Quên mật khẩu?')) window.openLRFModal('forgot');
        });
    });

    primaryBtn.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = btn.textContent.trim();

            if (text.includes('Đăng ký')) {
                const isValid = registerFormEl.checkValidity(); 

                if (!isValid || btn.disabled) {
                    e.preventDefault(); 
                    return;
                }

                e.preventDefault();
                window.openLRFModal('login');
            }
        });
    });

    const pwdInput = registerFormEl.querySelector('input[name="password"]');
    const cfPwdInput = registerFormEl.querySelector('input[name="cf_password"]');
    const submitBtn = registerFormEl.querySelector('.btn.btn-primary');
    const errorMessage = registerFormEl.querySelector('.non-same-pw'); 

    function validatePasswords() {
        if (pwdInput.value && cfPwdInput.value && pwdInput.value !== cfPwdInput.value) {
            errorMessage.style.display = 'block';       
            cfPwdInput.style.border = '1px solid red';  
            submitBtn.disabled = true;               
        } else {
            errorMessage.style.display = 'none';
            cfPwdInput.style.border = '';
            submitBtn.disabled = false;
        }
    }

    pwdInput.addEventListener('input', validatePasswords);
    cfPwdInput.addEventListener('input', validatePasswords);

    loginForm.addEventListener('submit', (e) =>{
        e.preventDefault();

        const email = loginForm.querySelector('input[name="email"]').value.trim();
        const password = loginForm.querySelector('input[name="password"]').value.trim();

        const userData = { name: 'Trịnh Trần Phương Tuấn', avatar: '../../public/assets/image/16.png' };

        document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));

        modal.classList.add('hidden')
    })
        
}
