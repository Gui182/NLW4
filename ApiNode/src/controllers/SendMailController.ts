import { resolve } from 'path';
import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { SurveysRepository } from '../repositories/SurveysRepository';
import { SurveysUsersRepository } from '../repositories/SurveysUsersRepository';
import { UsersRepository } from '../repositories/UserRepository';
import SendMailService from '../services/SendMailService';

class SendMailController {


    async execute(req: Request, res: Response){
        const { email, survey_id} = req.body

        const userRepository = getCustomRepository(UsersRepository)
        const surveysRepository = getCustomRepository(SurveysRepository)
        const surveyUsersRepository = getCustomRepository(SurveysUsersRepository)

        const userAlreadyExists = await userRepository.findOne({ email })

        if(!userAlreadyExists){
            return res.status(400).json({
                error: "User does not exists"
            })
        }

        const surveysAreadyExists = await surveysRepository .findOne({id: survey_id})
        
        if(!surveysAreadyExists){
            return res.status(400).json({
                error: "Survey does not exists"
            })
        }

        const surveyAreadyExistsDouble = surveyUsersRepository.findOne({
            where: [
                {user_id: userAlreadyExists.id},
                {value: null}
            ],
            relations: ["user", "survey"]
        })

        const variables = {
            name: userAlreadyExists.name,
            title: surveysAreadyExists.title,
            description: surveysAreadyExists.description,
            link: process.env.URL_MAIL
        }

        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs")

        if(surveyAreadyExistsDouble){
            await SendMailService.execute(email, surveysAreadyExists.title, variables, npsPath)
            return res.json(surveyAreadyExistsDouble)
        }

        const surveyUser = surveyUsersRepository.create({
            user_id: userAlreadyExists.id,
            survey_id
        })

        await surveyUsersRepository.save(surveyUser)

        await SendMailService.execute(email, surveysAreadyExists.title ,variables, npsPath )

        return res.json(surveyUser)
    }
}

export { SendMailController };
