# Hide Email
------------------------
By Mike Gieson [www.gieson.com](http://www.gieson.com "www.gieson.com")

Generate an all-inclusive <a> tag (no dependancies)
for both the encrypted and non-encrypted HTML email links.

When encrypted, an <a> tag is generateed and a blob is delivered to 
a function in the onclick, and subsequently decoded "on-the-fly".

When non-encrypted, an <a> tag is created and the onclick event 
contains a function to parse the attributes and generate a "mailto" URL. 
This allows the <a> tag to be edited without having to re-generate the 
entire <a> tag. While not as secure, it's more flexible for HTML authors.

	Where data-attributes will contain 4 things:
		data-u = first half of the email (user)
		data-d = second half of email (domain)
		data-s = email subject (optional)
		data-b = email body (optional)

##### Preview or use online at:
[http://www.gieson.com/Library/projects/utilities/hide-email]("http://www.gieson.com/Library/projects/utilities/hide-email")

